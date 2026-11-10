import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual, EgresoParaVuelto, labelMovimiento } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { PedidoDeVuelto } from '../pedido-en-lote';
import { Moneda } from '../../moneda/moneda.model';
import { MonedaService } from '../../moneda/moneda.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { erroresDeRechazo } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';
import { nuevaClaveIdempotencia } from '../../../../commons/core/utils/claveIdempotencia';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

/** Días que muestra la lista al abrir (hoy incluido). */
const DIAS_POR_DEFECTO = 3;

export interface VueltoEgresoDialogData {
  cajaVirtual: CajaVirtual;
}

/** La lista necesita espacio; el formulario de un vuelto, no. Quien abre el diálogo usa TAMANO_LISTA. */
export const TAMANO_LISTA = { width: '75vw', height: '75vh' };
const TAMANO_FORMULARIO = { width: '560px', height: 'auto' };

/** Fila de la tabla, con lo que muestra ya resuelto (sin llamadas desde el template). */
interface FilaVuelto extends EgresoParaVuelto {
  /** «Solicitud #N · rindió …» si el egreso pagó una solicitud de gasto. */
  _solicitud: string;
  /** Lo que el teléfono no rindió, para autocompletar el vuelto (null si no es de una solicitud). */
  _vueltoSugerido: number | null;
  _tipo: string;
  _entregadoA: string;
  _simbolo: string;
  _decimales: string;
}

/**
 * Vuelto de un egreso de la caja mayor: se elige de la lista (paginada en el central) el egreso de efectivo,
 * vario o pago de gasto que se rinde, y se registra lo devuelto en cualquier moneda. El central convierte
 * con la última cotización y no deja pasar lo pendiente.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-vuelto-egreso-dialog',
  templateUrl: './vuelto-egreso-dialog.component.html',
  styleUrls: ['./vuelto-egreso-dialog.component.scss']
})
export class VueltoEgresoDialogComponent implements OnInit {

  readonly displayedColumns = ['creadoEn', 'tipo', 'entregadoA', 'descripcion', 'monto', 'pendiente', 'acciones'];
  dataSource = new MatTableDataSource<FilaVuelto>([]);
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;
  isLoading = false;

  textoControl = new FormControl<string>('');
  /**
   * Rango de la fecha del egreso: arranca en los últimos DIAS_POR_DEFECTO días. Nunca se pide sin «desde»,
   * para no traer todo el historial de una vez; un rango más amplio lo elige el usuario.
   */
  desdeControl = new FormControl<Date>(null);
  hastaControl = new FormControl<Date>(null);

  /** El egreso elegido: con él se pasa del listado al formulario del vuelto. */
  seleccionado: FilaVuelto | null = null;
  monedaList: Moneda[] = [];
  monedaControl = new FormControl<Moneda>(null, Validators.required);
  montoControl = new FormControl<number>(null, [Validators.required, Validators.min(0.01)]);
  descripcionControl = new FormControl<string>('');
  currencyOptions: any;
  /** Se devuelve en otra moneda que la del egreso: el central convierte con la última cotización. */
  otraMoneda = false;

  isSaving = false;
  /** El pedido que quedó sin respuesta: solo se puede reenviar (misma clave) o cerrar. */
  private pedidoPendiente: PedidoDeVuelto | null = null;
  hayPendiente = false;

  constructor(
    private dialogRef: MatDialogRef<VueltoEgresoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VueltoEgresoDialogData,
    private cajaVirtualService: CajaVirtualService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService,
  ) { }

  ngOnInit(): void {
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) this.monedaList = res;
    });
    this.rangoPorDefecto();
    this.cargar();
  }

  private rangoPorDefecto(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - (DIAS_POR_DEFECTO - 1));
    this.desdeControl.setValue(desde);
    this.hastaControl.setValue(hoy);
  }

  /** Al cerrar el rango en el calendario (o al tipear el fin) se vuelve a buscar. */
  onRangoChange(): void {
    this.buscar();
  }

  /** Vuelve a los últimos DIAS_POR_DEFECTO días. */
  limpiarRango(): void {
    this.rangoPorDefecto();
    this.buscar();
  }

  /** El rango es distinto del de por defecto: recién ahí tiene sentido el botón para volver a él. */
  get rangoModificado(): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const desde = new Date(hoy);
    desde.setDate(hoy.getDate() - (DIAS_POR_DEFECTO - 1));
    return this.desdeControl.value?.getTime() !== desde.getTime() || this.hastaControl.value?.getTime() !== hoy.getTime();
  }

  buscar(): void {
    this.pageIndex = 0;
    this.cargar();
  }

  limpiarBusqueda(): void {
    this.textoControl.setValue('');
    this.buscar();
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }

  private cargar(): void {
    this.isLoading = true;
    const texto = this.textoControl.value?.trim() || null;
    // Sin «desde» (borrado a mano o inválido) se vuelve al rango por defecto en vez de traer todo.
    if (!this.desdeControl.value) this.rangoPorDefecto();
    const desde = this.desdeControl.value ? dateToString(this.desdeControl.value) : null;
    // El central lleva el fin al último minuto de ese día.
    const fin = this.hastaControl.value ? dateToString(this.hastaControl.value) : null;
    this.cajaVirtualService.onGetEgresosParaVuelto(this.data.cajaVirtual.id, texto, desde, fin, this.pageIndex, this.pageSize)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isLoading = false;
          this.totalElements = res?.getTotalElements ?? 0;
          this.dataSource.data = (res?.getContent ?? []).map(e => this.aFila(e));
        },
        error: () => {
          this.isLoading = false;
          this.notificacion.openWarn('No se pudieron cargar los egresos. Intentá de nuevo.', 5);
        }
      });
  }

  private aFila(e: EgresoParaVuelto): FilaVuelto {
    const m = e.movimiento;
    const pg = e.preGasto;
    const retirado = Number(pg?.montoRetirado ?? 0);
    const rendido = Number(pg?.montoGastado ?? 0);
    // Lo ya devuelto se descuenta: el pendiente del egreso es el tope.
    const sugerido = pg ? Math.min(Math.max(retirado - rendido - Number(e.devuelto ?? 0), 0), Number(e.pendiente ?? 0)) : null;
    return {
      ...e,
      _solicitud: pg ? `Solicitud de gasto #${pg.id} · rindió ${rendido.toLocaleString('es-PY')} de ${retirado.toLocaleString('es-PY')}` : '',
      _vueltoSugerido: sugerido,
      _tipo: labelMovimiento(m?.origenTipo, m?.tipoMovimiento, { EGRESO: 'Egreso', PAGO_PROVEEDOR: 'Pago' }),
      _entregadoA: m?.responsable?.persona?.nombre || '—',
      _simbolo: m?.moneda?.simbolo || '',
      _decimales: m?.moneda?.denominacion?.toUpperCase().includes('GUARANI') ? '1.0-0' : '1.2-2',
    };
  }

  elegir(fila: FilaVuelto): void {
    this.seleccionado = fila;
    // El formulario es chico: el diálogo se achica a su contenido y vuelve al tamaño de la lista con «Volver».
    this.dialogRef.updateSize(TAMANO_FORMULARIO.width, TAMANO_FORMULARIO.height);
    const moneda = this.monedaList.find(x => x.id === fila.movimiento?.moneda?.id) ?? fila.movimiento?.moneda ?? null;
    this.monedaControl.setValue(moneda);
    this.onMonedaChange();
    this.descripcionControl.setValue('');
    // De una solicitud: arranca con lo que el teléfono no rindió (en la moneda del egreso).
    if (fila._vueltoSugerido != null && fila.preGasto?.montoVuelto == null) {
      this.montoControl.setValue(fila._vueltoSugerido);
    }
  }

  volver(): void {
    if (this.isSaving || this.hayPendiente) return;
    this.seleccionado = null;
    this.dialogRef.updateSize(TAMANO_LISTA.width, TAMANO_LISTA.height);
  }

  onMonedaChange(): void {
    const m = this.monedaControl.value;
    this.currencyOptions = m ? this.monedaService.currencyOptionsByMoneda(m) : null;
    this.otraMoneda = !!m && m.id !== this.seleccionado?.movimiento?.moneda?.id;
    // Arranca en cero: se escribe lo que efectivamente se devolvió (el pendiente es solo referencia).
    this.montoControl.setValue(0);
  }

  onConfirmar(): void {
    if (!this.seleccionado || this.isSaving || this.hayPendiente) return;
    if (this.monedaControl.invalid || this.montoControl.invalid || !(this.montoControl.value > 0)) {
      this.notificacion.openAlgoSalioMal('Completá la moneda y un monto mayor a 0');
      return;
    }
    // Una clave por cada «Confirmar»: el pedido se guarda con ella para reenviarlo idéntico.
    this.enviar({
      egresoId: this.seleccionado.movimiento.id,
      monedaId: this.monedaControl.value.id,
      monto: this.montoControl.value,
      descripcion: this.descripcionControl.value?.trim().toUpperCase() || null,
      claveIdempotencia: nuevaClaveIdempotencia(),
    });
  }

  /** Reenvía el vuelto que quedó sin respuesta, con la misma clave: si ya se había registrado no se repite. */
  reenviar(): void {
    if (this.pedidoPendiente && !this.isSaving) this.enviar(this.pedidoPendiente);
  }

  private enviar(pedido: PedidoDeVuelto): void {
    this.isSaving = true;
    this.dialogRef.disableClose = true;
    this.cajaVirtualService.onRegistrarVuelto(pedido, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
      next: res => {
        this.isSaving = false;
        if (res == null) { this.sinConfirmar(pedido); return; }
        this.notificacion.openSucess('Vuelto registrado');
        this.dialogRef.disableClose = false;
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSaving = false;
        if (erroresDeRechazo(err)) {
          // No se registró (el motivo ya lo mostró onSaveCustom): queda el formulario para corregir.
          this.pedidoPendiente = null;
          this.hayPendiente = false;
          this.dialogRef.disableClose = false;
          return;
        }
        this.sinConfirmar(pedido, !esTimeoutDeLink(err));
      }
    });
  }

  private sinConfirmar(pedido: PedidoDeVuelto, avisar = true): void {
    this.pedidoPendiente = pedido;
    this.hayPendiente = true;
    if (avisar) {
      this.notificacion.openWarn('No se pudo confirmar si el vuelto se registró: podés reintentar sin riesgo de repetirlo.', 8);
    }
  }

  /** Cierra con el vuelto sin confirmar; cierra con `true` para que la caja se relea. */
  cerrarSinConfirmar(): void {
    if (this.isSaving) return;
    this.notificacion.openWarn('No se pudo confirmar si el vuelto se registró: revisá los movimientos de la caja antes de cargarlo de nuevo.', 12);
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
