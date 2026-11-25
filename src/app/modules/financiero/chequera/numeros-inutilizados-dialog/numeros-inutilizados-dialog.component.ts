import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of, Subject } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { Chequera } from '../chequera.model';
import { AccionChequeInutilizado, NumeracionChequeraService, NumeroInutilizado } from '../numeracion-chequera.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ChequeService } from '../../cheque/cheque.service';
import { AnulacionChequeInput, Cheque } from '../../cheque/cheque.model';
import { ChequeAnulacionService } from '../../cheque/cheque-anulacion.service';
import { DetallePagoDialogComponent, DetallePagoDialogData } from '../../caja-virtual/detalle-pago-dialog/detalle-pago-dialog.component';

/** Fila de la lista con lo que se muestra ya armado (sin funciones en el HTML). */
interface FilaInutilizado extends NumeroInutilizado {
  _vigente: boolean;
  _accionLabel: string;
  _usuario: string;
}

/** Qué se sabe del cheque del número a inutilizar. */
type EstadoBusqueda = 'VACIO' | 'BUSCANDO' | 'SIN_CHEQUE' | 'CON_CHEQUE' | 'NO_LEIDO';

const ACCION_LABEL: Record<AccionChequeInutilizado, string> = {
  NINGUNA: 'Sin cheque',
  ANULADO: 'Cheque anulado',
  RENUMERADO: 'Cheque renumerado',
};

const OPCION_NINGUNA = { value: 'NINGUNA' as AccionChequeInutilizado, label: 'El número no tiene cheque' };
const OPCION_ANULAR = { value: 'ANULADO' as AccionChequeInutilizado, label: 'Anular el cheque también' };
const OPCION_RENUMERAR = { value: 'RENUMERADO' as AccionChequeInutilizado, label: 'Pasar el cheque a otro número' };

/**
 * Números inutilizados de una chequera (central #603, desk #720): la hoja dañada, perdida o mal llenada. El número
 * inutilizado no sale en ningún cheque nuevo. Si ya tenía un cheque, se muestra y se elige qué hacer con él:
 * anularlo (solo un cheque suelto: el de un pago se revierte desde el pago) o pasarlo a otro número (la hoja se
 * arruinó y el cheque real se escribió en otra).
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
  accion: AccionChequeInutilizado | null = 'NINGUNA';
  numeroNuevo: number | null = null;
  guardando = false;
  /** Hubo algún cambio: al cerrar, quien abrió relee la chequera (próximo número y hojas). */
  huboCambios = false;
  /** Primer número libre según el central: el contador de la chequera no saltea los inutilizados. */
  proximoNumero: number | null = null;

  /** El cheque que ya tiene el número (activo, o el anulado si es el único). Campos ya armados para el HTML. */
  busqueda: EstadoBusqueda = 'VACIO';
  cheque: Cheque | null = null;
  chequeActivo = false;
  chequePagoId: number | null = null;
  chequeMonto = '';
  chequeEstado = '';
  acciones = [OPCION_NINGUNA, OPCION_ANULAR, OPCION_RENUMERAR];

  private numero$ = new Subject<number | null>();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { chequera: Chequera },
    private numeracion: NumeracionChequeraService,
    private chequeService: ChequeService,
    private notificacion: NotificacionSnackbarService,
    private dialogos: DialogosService,
    private dialog: MatDialog,
    private chequeAnulacion: ChequeAnulacionService,
  ) {
    this.chequera = data?.chequera;
    this.proximoNumero = this.chequera?.siguienteNumero != null ? Number(this.chequera.siguienteNumero) : null;
  }

  ngOnInit(): void {
    this.cargar();
    // switchMap: si se sigue tipeando, la respuesta del número anterior se descarta.
    this.numero$.pipe(
      tap(n => { this.limpiarCheque(); this.busqueda = n ? 'BUSCANDO' : 'VACIO'; }),
      debounceTime(400),
      switchMap(n => n ? this.buscarCheque(n) : of(undefined)),
      untilDestroyed(this),
    ).subscribe(res => { if (res !== undefined) this.mostrarCheque(res); });
  }

  onNumeroChange(n: number | null) {
    this.numero$.next(n ? Number(n) : null);
  }

  /** El cheque de ese número en la chequera, por la misma consulta del tablero. null = sin cheque; undefined = no se pudo leer. */
  private buscarCheque(numero: number) {
    return this.chequeService.onGetChequesDashboard({
      desde: '2000-01-01 00:00', hasta: '2100-12-31 23:59', tipoFecha: 'EMISION',
      chequeraId: this.chequera.id, texto: String(numero),
    }).pipe(
      // El texto también busca en beneficiario y concepto, y el número por «contiene»: se filtra el exacto.
      map(lista => {
        const delNumero = (lista || []).filter(c => Number(c.numero) === numero);
        return delNumero.find(c => c.estado !== 'ANULADO') || delNumero[0] || null;
      }),
      catchError(() => of('ERROR' as const)),
    );
  }

  private mostrarCheque(res: Cheque | null | 'ERROR') {
    if (res === 'ERROR') {
      // Sin la lectura quedan las tres opciones: el central rechaza la que no corresponda.
      this.busqueda = 'NO_LEIDO';
      this.acciones = [OPCION_NINGUNA, OPCION_ANULAR, OPCION_RENUMERAR];
      this.accion = 'NINGUNA';
      return;
    }
    this.cheque = res;
    this.chequeActivo = !!res && res.estado !== 'ANULADO';
    if (!this.chequeActivo) {
      // Sin cheque, o con uno ya anulado: el central lo inutiliza directo.
      this.busqueda = res ? 'CON_CHEQUE' : 'SIN_CHEQUE';
      this.acciones = [OPCION_NINGUNA];
      this.accion = 'NINGUNA';
    } else {
      this.busqueda = 'CON_CHEQUE';
      this.chequePagoId = res.pagoId || null;
      // El de un pago no se anula acá: dejaría el pago pagado con un cheque que no existe.
      this.acciones = this.chequePagoId ? [OPCION_RENUMERAR] : [OPCION_ANULAR, OPCION_RENUMERAR];
      this.accion = this.chequePagoId ? 'RENUMERADO' : null;
    }
    if (res) {
      this.chequeMonto = `${res.moneda?.simbolo || ''} ${(res.total ?? 0).toLocaleString('es-PY')}`.trim();
      this.chequeEstado = ESTADO_LABEL[res.estado as string] || String(res.estado || '');
    }
  }

  private limpiarCheque() {
    this.cheque = null;
    this.chequeActivo = false;
    this.chequePagoId = null;
    this.chequeMonto = '';
    this.chequeEstado = '';
    this.acciones = [OPCION_NINGUNA, OPCION_ANULAR, OPCION_RENUMERAR];
    this.accion = 'NINGUNA';
    this.numeroNuevo = null;
  }

  usarProximoLibre() {
    this.numeroNuevo = this.proximoNumero;
  }

  verPago() {
    if (!this.chequePagoId) return;
    const data: DetallePagoDialogData = { pagoId: this.chequePagoId, descripcion: 'Cheque Nº ' + (this.cheque?.numero || '') };
    this.dialog.open(DetallePagoDialogComponent, { width: '65vw', maxWidth: '95vw', height: '70vh', data });
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
    if (this.guardando || this.busqueda === 'BUSCANDO') return;
    if (!this.numero) { this.notificacion.openAlgoSalioMal('Indicá el número a inutilizar'); return; }
    if (!this.motivo?.trim()) { this.notificacion.openAlgoSalioMal('El motivo es obligatorio'); return; }
    if (!this.accion) { this.notificacion.openAlgoSalioMal('Elegí qué hacer con el cheque de ese número'); return; }
    if (this.accion === 'RENUMERADO' && !this.numeroNuevo) {
      this.notificacion.openAlgoSalioMal('Indicá el número al que pasa el cheque'); return;
    }
    // El cheque que se anula lleva su motivo de la lista (#807), aparte del motivo de la inutilización.
    if (this.accion === 'ANULADO' && this.cheque) {
      this.chequeAnulacion.pedirMotivo([this.cheque], 'Se inutiliza el número ' + this.numero + ' y se anula su cheque.')
        .pipe(untilDestroyed(this)).subscribe(anulacion => { if (anulacion) this.enviarInutilizacion(anulacion); });
      return;
    }
    this.enviarInutilizacion(null);
  }

  private enviarInutilizacion(anulacionCheque: AnulacionChequeInput | null) {
    if (this.guardando) return;
    this.guardando = true;
    this.numeracion.onInutilizar({
      chequeraId: this.chequera.id, numero: this.numero, motivo: this.motivo.trim().toUpperCase(),
      accionCheque: this.accion, numeroNuevo: this.accion === 'RENUMERADO' ? this.numeroNuevo : null,
      anulacionCheque,
    }).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.guardando = false;
        this.huboCambios = true;
        this.notificacion.openSucess('Número ' + this.numero + ' inutilizado');
        this.numero = null; this.motivo = '';
        this.limpiarCheque();
        this.busqueda = 'VACIO';
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

const ESTADO_LABEL: Record<string, string> = {
  DIFERIDO: 'Diferido', EMITIDO: 'Al día, sin cobrar', COBRADO: 'Cobrado', ANULADO: 'Anulado',
};
