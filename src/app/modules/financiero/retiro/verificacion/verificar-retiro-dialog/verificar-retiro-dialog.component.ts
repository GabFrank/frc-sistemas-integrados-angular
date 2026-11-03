import { Component, Inject, QueryList, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { from } from 'rxjs';
import { concatMap, map, toArray } from 'rxjs/operators';
import { Retiro } from '../../retiro.model';
import { RetiroService } from '../../retiro.service';
import { CajaVirtual } from '../../../caja-virtual/caja-virtual.model';
import { operaAcotadoCaja } from '../../../caja-virtual/rol-tesoreria-caja';
import { RetiroVerificacionService } from '../retiro-verificacion.service';
import { VerificarRetiroBloqueComponent } from '../verificar-retiro-bloque/verificar-retiro-bloque.component';
import { DialogosService } from '../../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../../notificacion-snackbar.service';
import { MainService } from '../../../../../main.service';

export interface VerificarRetiroDialogData {
  /** Uno, o varios de la misma caja del PDV apilados: cada uno con su propio conteo. */
  retiros: Retiro[];
  cajaVirtual: CajaVirtual;
}

/**
 * Verificación de uno o varios retiros de una misma caja al recibirlos en tesorería.
 *
 * El que recibe cuenta la plata contra lo que declaró el PDV. A la caja mayor entra
 * <b>lo contado</b>: el retiro es inmutable y queda como la declaración del origen. Cada retiro
 * se verifica por separado, con su conteo y su caso si hay diferencia.
 *
 * Se cierra con los retiros que entraron (lista vacía = ninguno).
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-verificar-retiro-dialog',
  templateUrl: './verificar-retiro-dialog.component.html',
  styleUrls: ['./verificar-retiro-dialog.component.scss'],
})
export class VerificarRetiroDialogComponent {

  @ViewChildren(VerificarRetiroBloqueComponent) bloques: QueryList<VerificarRetiroBloqueComponent>;

  /** Los que faltan confirmar. Los que entran salen de la lista. */
  retiros: Retiro[];
  guardando = false;
  /** Falló la confirmación y no se pudo saber qué entró: reintentar podría mentir sobre el resultado. */
  sinConfirmar = false;
  titulo: string;
  subtitulo: string;

  private ingresados: Retiro[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VerificarRetiroDialogData,
    private dialogRef: MatDialogRef<VerificarRetiroDialogComponent>,
    private service: RetiroVerificacionService,
    private retiroService: RetiroService,
    private dialogosService: DialogosService,
    private notificacion: NotificacionSnackbarService,
    private mainService: MainService,
  ) {
    this.retiros = [...(data.retiros || [])];
    const r0 = this.retiros[0];
    this.titulo = this.retiros.length > 1
      ? `Verificar ${this.retiros.length} retiros de la caja ${r0?.cajaSalida?.id}`
      : `Verificar retiro #${r0?.id}`;
    this.subtitulo = `${r0?.sucursal?.nombre || 'Sucursal ' + r0?.sucursalId} · entra a ${data.cajaVirtual?.nombre}`;
  }

  porId(_: number, r: Retiro): number {
    return r.id;
  }

  onConfirmar() {
    if (this.guardando || this.sinConfirmar) return;
    const bloques = this.bloques.toArray();

    const motivo = bloques.map(b => b.motivoParaNoConfirmar()).find(m => m != null);
    if (motivo != null) {
      this.notificacion.notification$.next({ texto: motivo, color: NotificacionColor.warn, duracion: 6 });
      return;
    }

    const diferencias = bloques
      .filter(b => b.hayDiferencia)
      .map(b => (bloques.length > 1 ? `Retiro #${b.retiro.id} — ` : '') + b.resumenDiferencias());
    if (diferencias.length) {
      this.dialogosService.confirm(
        'Confirmar con diferencia',
        'Se va a acreditar lo contado y se abrirá un caso para investigar.',
        diferencias.length === 1 ? diferencias[0] : null,
        diferencias.length > 1 ? diferencias : null,
        true, 'Sí, confirmar', 'No',
      ).pipe(untilDestroyed(this)).subscribe(res => { if (res === true) this.enviar(bloques); });
      return;
    }
    this.enviar(bloques);
  }

  /**
   * De a uno y en orden: cada retiro queda con su conteo y su caso. El central no acredita dos veces
   * (toma el lock del retiro y rechaza lo ya verificado).
   */
  private enviar(bloques: VerificarRetiroBloqueComponent[]) {
    this.guardando = true;
    const caja = this.data.cajaVirtual;
    from(bloques).pipe(
      concatMap(b => this.service.onVerificar(
        b.retiro.id, b.retiro.sucursalId, caja.id, b.conteos(), b.esRapida(), b.observacion,
      ).pipe(map(res => {
        // null = el servidor no confirmó: se trata como falla y se reconcilia.
        if (res == null) throw new Error('sin respuesta');
        this.marcarIngresado(b.retiro);
        return res;
      }))),
      toArray(),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.dialogRef.close(this.ingresados);
      },
      // El aviso del error lo da onSaveCustom; acá solo se reconcilia.
      error: () => this.reconciliar(bloques.length),
    });
  }

  /**
   * Ante cualquier falla se pregunta qué sigue pendiente. El central pudo haber commiteado el que
   * «falló» (red caída después del commit), u otra PC pudo verificar uno del apilado: lo que ya no
   * está pendiente sale del diálogo, aunque no haya devuelto OK, para que un reintento no se trabe.
   */
  private reconciliar(total: number) {
    const r0 = this.retiros[0];
    const cajaId = r0?.cajaSalida?.id;
    if (cajaId == null) {
      this.noSeSupoQueEntro();
      return;
    }
    const destinoId = operaAcotadoCaja(this.mainService) ? this.data.cajaVirtual?.id : undefined;
    this.retiroService.onGetPendientesDeCaja(r0.sucursalId, cajaId, destinoId).pipe(untilDestroyed(this)).subscribe({
      next: pendientes => {
        this.guardando = false;
        const siguen = new Set(pendientes.map(p => p.id));
        this.retiros.filter(r => !siguen.has(r.id)).forEach(r => this.marcarIngresado(r));
        if (!this.retiros.length) {
          this.dialogRef.close(this.ingresados);
          return;
        }
        if (this.ingresados.length) {
          this.notificacion.notification$.next({
            texto: `${this.ingresados.length} de ${total} retiros ingresados. Quedan ${this.retiros.length} por confirmar.`,
            color: NotificacionColor.warn, duracion: 8,
          });
        }
      },
      error: () => this.noSeSupoQueEntro(),
    });
  }

  private noSeSupoQueEntro() {
    this.guardando = false;
    this.sinConfirmar = true;
    this.notificacion.notification$.next({
      texto: 'No se pudo confirmar qué retiros entraron: cerrá y volvé a abrir antes de reintentar.',
      color: NotificacionColor.warn, duracion: 10,
    });
  }

  /** Entró: sale del diálogo y se borra su borrador (el conteo ya quedó en el backend). */
  private marcarIngresado(r: Retiro) {
    this.service.borrarBorrador(r.id, r.sucursalId);
    this.ingresados.push(r);
    this.retiros = this.retiros.filter(x => x.id !== r.id);
  }

  onCancelar() {
    if (this.guardando) return;
    // No se borran los borradores: cerrar sin confirmar es justamente el caso que resuelven.
    this.dialogRef.close(this.ingresados);
  }
}
