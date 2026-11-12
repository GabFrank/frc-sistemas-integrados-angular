import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Chequera } from '../chequera.model';
import { AccionChequeInutilizado, NumeracionChequeraService, NumeroInutilizado } from '../numeracion-chequera.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';

/** Fila de la lista con lo que se muestra ya armado (sin funciones en el HTML). */
interface FilaInutilizado extends NumeroInutilizado {
  _vigente: boolean;
  _accionLabel: string;
  _usuario: string;
}

const ACCION_LABEL: Record<AccionChequeInutilizado, string> = {
  NINGUNA: 'Sin cheque',
  ANULADO: 'Cheque anulado',
  RENUMERADO: 'Cheque renumerado',
};

/**
 * Números inutilizados de una chequera (central #603, desk #720): la hoja dañada, perdida o mal llenada. El número
 * inutilizado no sale en ningún cheque nuevo. Si ya tenía un cheque, se elige qué hacer con él: anularlo (solo un
 * cheque suelto) o pasarlo a otro número (la hoja se arruinó y el cheque real se escribió en otra).
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-numeros-inutilizados-dialog',
  templateUrl: './numeros-inutilizados-dialog.component.html',
  styleUrls: ['./numeros-inutilizados-dialog.component.scss'],
})
export class NumerosInutilizadosDialogComponent implements OnInit {

  chequera: Chequera;
  filas: FilaInutilizado[] = [];
  cargando = true;

  numero: number | null = null;
  motivo = '';
  accion: AccionChequeInutilizado = 'NINGUNA';
  numeroNuevo: number | null = null;
  guardando = false;
  /** Hubo algún cambio: al cerrar, quien abrió relee la chequera (próximo número y hojas). */
  huboCambios = false;
  /** Primer número libre según el central: el contador de la chequera no saltea los inutilizados. */
  proximoNumero: number | null = null;

  acciones: { value: AccionChequeInutilizado; label: string }[] = [
    { value: 'NINGUNA', label: 'El número no tiene cheque' },
    { value: 'ANULADO', label: 'Anular el cheque también (solo si no es de un pago)' },
    { value: 'RENUMERADO', label: 'Pasar el cheque a otro número' },
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { chequera: Chequera },
    private numeracion: NumeracionChequeraService,
    private notificacion: NotificacionSnackbarService,
    private dialogos: DialogosService,
  ) {
    this.chequera = data?.chequera;
    this.proximoNumero = this.chequera?.siguienteNumero != null ? Number(this.chequera.siguienteNumero) : null;
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.numeracion.onGetProximos(this.chequera.id, 1).pipe(untilDestroyed(this)).subscribe(nums => {
      // Sin números libres la chequera queda agotada: no hay próximo.
      if (nums) this.proximoNumero = nums[0] ?? null;
    });
    this.numeracion.onGetInutilizados(this.chequera.id).pipe(untilDestroyed(this)).subscribe(lista => {
      this.cargando = false;
      this.filas = lista.map(i => ({
        ...i,
        _vigente: !i.revertidoEn,
        _accionLabel: ACCION_LABEL[i.accionCheque] + (i.accionCheque === 'RENUMERADO' && i.numeroNuevo ? ' → Nº ' + i.numeroNuevo : ''),
        _usuario: i.usuario?.persona?.nombre || '',
      }));
    });
  }

  inutilizar() {
    if (this.guardando) return;
    if (!this.numero) { this.notificacion.openAlgoSalioMal('Indicá el número a inutilizar'); return; }
    if (!this.motivo?.trim()) { this.notificacion.openAlgoSalioMal('El motivo es obligatorio'); return; }
    if (this.accion === 'RENUMERADO' && !this.numeroNuevo) {
      this.notificacion.openAlgoSalioMal('Indicá el número al que pasa el cheque'); return;
    }
    this.guardando = true;
    this.numeracion.onInutilizar({
      chequeraId: this.chequera.id, numero: this.numero, motivo: this.motivo.trim().toUpperCase(),
      accionCheque: this.accion, numeroNuevo: this.accion === 'RENUMERADO' ? this.numeroNuevo : null,
    }).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.guardando = false;
        this.huboCambios = true;
        this.notificacion.openSucess('Número ' + this.numero + ' inutilizado');
        this.numero = null; this.motivo = ''; this.accion = 'NINGUNA'; this.numeroNuevo = null;
        this.cargar();
      },
      error: e => {
        this.guardando = false;
        this.notificacion.openAlgoSalioMal(e?.message || 'No se pudo inutilizar el número');
      },
    });
  }

  revertir(fila: FilaInutilizado) {
    // La numeración no vuelve atrás del correlativo (las hojas anteriores pudieron usarse fuera del sistema): un
    // número que ya quedó atrás pierde la marca pero no se reusa. Dentro del diálogo no se emite, así que el
    // correlativo con el que se abrió sigue siendo el de la chequera.
    const correlativo = this.chequera?.siguienteNumero != null ? Number(this.chequera.siguienteNumero) : null;
    const quedoAtras = correlativo != null && Number(fila.numero) < correlativo;
    const mensaje = quedoAtras
      ? `El número ${fila.numero} quedó atrás de la numeración (va por el ${correlativo}): se quita la marca, pero no se vuelve a usar para un cheque nuevo.`
      : `El número ${fila.numero} vuelve a estar libre para un cheque nuevo.`;
    this.dialogos.confirm('Revertir inutilización', mensaje,
      fila.accionCheque === 'ANULADO' ? 'El cheque que se anuló sigue anulado.' : null,
      null, true, 'Revertir', 'Cancelar').pipe(untilDestroyed(this)).subscribe(ok => {
      if (ok !== true) return;
      this.numeracion.onRevertir(fila.id).pipe(untilDestroyed(this)).subscribe({
        next: () => { this.huboCambios = true; this.notificacion.openSucess('Inutilización revertida'); this.cargar(); },
        error: e => this.notificacion.openAlgoSalioMal(e?.message || 'No se pudo revertir'),
      });
    });
  }
}
