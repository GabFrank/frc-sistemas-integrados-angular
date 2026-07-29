import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  LOCALE_ID,
  OnInit
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime } from 'rxjs/operators';

import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ESTADO_LOTE_LABELS, EstadoLote, StockLotePresentacion } from '../../lote/lote.model';
import { LoteService } from '../../lote/lote.service';
import { EtapaAsignacionLote, TransferenciaItemLote } from '../transferencia.model';

/** Tolerancia al comparar cantidades que el backend devuelve ya divididas. */
const EPSILON = 0.0001;

export interface SeleccionarLotesDialogData {
  productoId: number;
  productoDescripcion: string;
  sucursalOrigenId: number;
  sucursalOrigenNombre: string;
  /**
   * Cantidad del ítem EN PRESENTACIONES, la misma unidad que muestra la fila de alta. Es lo que
   * hay que repartir entre los lotes.
   */
  cantidad: number;
  etapa: EtapaAsignacionLote;
  /** Presentación con la que se está cargando. El backend convierte los saldos a esta medida. */
  presentacionId: number;
  /** Asignación ya guardada, con las cantidades ya expresadas en presentaciones por el backend. */
  asignacionActual?: TransferenciaItemLote[];
  /**
   * Invierte la relación: en vez de repartir una cantidad ya fijada, el total que se asigna acá
   * ES la cantidad a transferir. Se usa al cargar un ítem nuevo, donde la cantidad todavía no
   * existe y sale justamente de decidir cuánto se saca de cada lote.
   */
  cantidadDefinidaPorLotes?: boolean;
}

/** Lo que devuelve el diálogo al cerrarse con "Confirmar". */
export interface SeleccionarLotesDialogResult {
  /** Reparto elegido, EN PRESENTACIONES. El backend lo convierte a unidades al guardar. */
  lotes: { loteId: number; cantidad: number }[];
  etapa: EtapaAsignacionLote;
  /** Suma de lo asignado, en presentaciones. Es lo que va al campo "Cant. por present.". */
  total: number;
}

/**
 * Fila de la tabla. Todo lo derivado se precalcula acá: el template solo lee propiedades.
 */
interface LoteRow {
  loteId: number;
  numeroLote: string;
  fechaVencimientoLabel: string;
  fechaRetiroLabel: string;
  estadoLabel: string;
  estadoClase: string;
  /** Saldo en la presentación del ítem, tal como lo devolvió el backend. */
  disponible: number;
  /** El mismo saldo ya formateado para mostrar, sin separador de miles. */
  disponibleLabel: string;
  /** Equivalente en unidades, solo informativo. Vacío si la presentación vale 1. */
  disponibleUnidadesLabel: string;
  /** Los lotes que no están LIBERADO no se pueden elegir: es el bloqueo por recall. */
  seleccionable: boolean;
  control: FormControl;
}

/**
 * Elección manual de los lotes de los que sale un ítem de transferencia.
 *
 * Por defecto el backend reparte por FEFO. Este diálogo deja sobreescribir esa decisión cuando
 * la realidad del depósito no coincide con el orden teórico. Lo que no se cubra acá lo completa
 * el backend por FEFO igual que siempre.
 *
 * Unidad de medida: se trabaja SIEMPRE en presentaciones, igual que el campo "Cant. por present."
 * de la fila de alta. El stock por lote se lleva en unidades, pero la conversión la hace el
 * backend en las dos puntas (al devolver el saldo y al guardar la asignación), justamente para
 * que no existan dos implementaciones de la misma regla.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-seleccionar-lotes-dialog',
  templateUrl: './seleccionar-lotes-dialog.component.html',
  styleUrls: ['./seleccionar-lotes-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeleccionarLotesDialogComponent implements OnInit {

  readonly displayedColumns = [
    'numeroLote', 'fechaVencimiento', 'fechaRetiro', 'estado', 'disponible', 'cantidad'
  ];

  filas: LoteRow[] = [];
  cargando = true;
  sinLotes = false;

  // Totales precalculados. La guía prohíbe getters y cálculos en el template.
  cantidadRequerida = 0;
  totalAsignado = 0;
  faltante = 0;
  hayFaltante = false;
  excedeRequerido = false;
  mensajeFaltante = '';
  // Etiquetas ya formateadas, para que el template no aplique pipes ni formatee nada.
  cantidadRequeridaLabel = '0';
  totalAsignadoLabel = '0';
  faltanteLabel = '0';

  productoDescripcion = '';
  sucursalOrigenNombre = '';
  presentacionLabel = '';
  /** True si una presentación vale más de una unidad: ahí importa mostrar la equivalencia. */
  esPresentacionMultiple = false;
  /** True cuando el total elegido define la cantidad, en vez de tener que cubrir una ya fijada. */
  cantidadDefinidaPorLotes = false;
  tituloCantidad = 'Cantidad a transferir';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarLotesDialogData,
    private dialogRef: MatDialogRef<SeleccionarLotesDialogComponent>,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    this.cantidadDefinidaPorLotes = this.data?.cantidadDefinidaPorLotes === true;
    this.cantidadRequerida = this.data?.cantidad || 0;
    this.cantidadRequeridaLabel = this.formatearCantidad(this.cantidadRequerida);
    this.productoDescripcion = this.data?.productoDescripcion || '';
    this.sucursalOrigenNombre = this.data?.sucursalOrigenNombre || '';
    this.tituloCantidad = this.cantidadDefinidaPorLotes
      ? 'Total elegido'
      : 'Cantidad a transferir';
    this.cargarLotes();
  }

  private cargarLotes(): void {
    this.loteService
      .onGetStockPorLoteEnPresentacion(
        this.data.productoId,
        this.data.sucursalOrigenId,
        this.data.presentacionId
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: StockLotePresentacion[]) => {
          const lotes = res || [];
          this.tomarDatosDePresentacion(lotes);
          this.filas = lotes.map((lote) => this.crearFila(lote));
          this.sinLotes = this.filas.length === 0;
          this.cargando = false;
          this.escucharCambios();
          this.recalcularTotales();
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.notificacionService.openAlgoSalioMal('Error al consultar los lotes disponibles');
          this.cdr.markForCheck();
        }
      });
  }

  /** El nombre y el factor de la presentación vienen resueltos con el saldo. */
  private tomarDatosDePresentacion(lotes: StockLotePresentacion[]): void {
    const primero = lotes[0];
    const unidades = primero?.unidadesPorPresentacion || 1;
    this.esPresentacionMultiple = unidades > 1;
    const nombre = primero?.presentacionDescripcion;
    this.presentacionLabel = this.esPresentacionMultiple
      ? `${nombre || 'Presentación'} · ${unidades} unidades c/u`
      : nombre || 'Unidad';
  }

  private crearFila(lote: StockLotePresentacion): LoteRow {
    const seleccionable = lote.estado === EstadoLote.LIBERADO;
    const control = new FormControl({
      value: this.cantidadPreviaDe(lote.loteId),
      disabled: !seleccionable
    });
    return {
      loteId: lote.loteId,
      numeroLote: lote.numeroLote || '-',
      fechaVencimientoLabel: this.fechaCorta(lote.fechaVencimiento),
      fechaRetiroLabel: this.fechaCorta(lote.fechaRetiro),
      estadoLabel: ESTADO_LOTE_LABELS[lote.estado] || lote.estado || '-',
      estadoClase: this.claseSegunEstado(lote.estado),
      disponible: lote.cantidadDisponiblePresentacion,
      disponibleLabel: this.formatearCantidad(lote.cantidadDisponiblePresentacion),
      disponibleUnidadesLabel: this.esPresentacionMultiple
        ? `${this.formatearCantidad(lote.cantidadDisponible)} unid.`
        : '',
      seleccionable,
      control
    };
  }

  /** Cantidad que ya tenía asignada este lote, para precargar el diálogo al reeditar. */
  private cantidadPreviaDe(loteId: number): number {
    const previa = (this.data?.asignacionActual || []).find((a) => a.loteId === loteId);
    return previa ? previa.cantidadPresentacion : null;
  }

  private escucharCambios(): void {
    this.filas.forEach((fila) => {
      fila.control.valueChanges
        .pipe(debounceTime(150), untilDestroyed(this))
        .subscribe(() => {
          this.recalcularTotales();
          this.cdr.markForCheck();
        });
    });
  }

  /**
   * Suma lo asignado y arma el mensaje de estado. Es la única fuente de los totales que muestra
   * el template, para no recalcular nada en cada ciclo de detección de cambios.
   *
   * La suma vive acá y no en el backend porque es feedback en vivo de lo que el operador está
   * tipeando, no una regla de negocio: la conversión y la validación contra el saldo real las
   * resuelve el servidor.
   */
  private recalcularTotales(): void {
    let total = 0;
    this.filas.forEach((fila) => {
      const valor = Number(fila.control.value);
      if (!isNaN(valor) && valor > 0) {
        total += valor;
      }
    });
    this.totalAsignado = total;
    this.totalAsignadoLabel = this.formatearCantidad(total);

    // Cuando el total define la cantidad no hay nada que cubrir: no puede faltar ni sobrar.
    if (this.cantidadDefinidaPorLotes) {
      this.cantidadRequerida = total;
      this.cantidadRequeridaLabel = this.totalAsignadoLabel;
      this.faltante = 0;
      this.faltanteLabel = '0';
      this.hayFaltante = false;
      this.excedeRequerido = false;
      this.mensajeFaltante =
        total > 0
          ? 'Esta es la cantidad que se va a transferir del producto.'
          : 'Indicá cuánto sacar de cada lote. La suma es lo que se transfiere.';
      return;
    }

    this.faltante = this.cantidadRequerida - total;
    this.faltanteLabel = this.formatearCantidad(this.faltante);
    this.hayFaltante = this.faltante > EPSILON;
    this.excedeRequerido = this.faltante < -EPSILON;

    if (this.excedeRequerido) {
      this.mensajeFaltante =
        'Asignaste más de lo que se transfiere. Ajustá las cantidades antes de confirmar.';
    } else if (this.hayFaltante) {
      this.mensajeFaltante =
        'El resto lo completa el sistema por FEFO, empezando por lo que vence antes.';
    } else {
      this.mensajeFaltante = 'La cantidad está cubierta con los lotes elegidos.';
    }
  }

  /**
   * Reparte la cantidad requerida por FEFO, que es el orden en el que ya vienen los lotes.
   * Sirve como punto de partida cuando el operador solo quiere corregir un lote.
   */
  onSugerirFefo(): void {
    let pendiente = this.cantidadRequerida;
    this.filas.forEach((fila) => {
      if (!fila.seleccionable) {
        return;
      }
      const aTomar = pendiente > EPSILON ? Math.min(fila.disponible, pendiente) : null;
      fila.control.setValue(aTomar, { emitEvent: false });
      if (aTomar) {
        pendiente -= aTomar;
      }
    });
    this.recalcularTotales();
    this.cdr.markForCheck();
  }

  onLimpiar(): void {
    this.filas.forEach((fila) => fila.control.setValue(null, { emitEvent: false }));
    this.recalcularTotales();
    this.cdr.markForCheck();
  }

  onConfirmar(): void {
    if (this.excedeRequerido) {
      this.notificacionService.openWarn(
        'No podés asignar más cantidad de la que se transfiere'
      );
      return;
    }
    // En este modo el total ES la cantidad del ítem: confirmar con cero dejaría un ítem sin nada.
    if (this.cantidadDefinidaPorLotes && this.totalAsignado <= 0) {
      this.notificacionService.openWarn(
        'Indicá cuánto sacar de al menos un lote'
      );
      return;
    }
    if (this.haySobreasignacionPorLote()) {
      return;
    }
    this.dialogRef.close({
      lotes: this.asignacionElegida(),
      etapa: this.data.etapa,
      total: this.totalAsignado
    } as SeleccionarLotesDialogResult);
  }

  /**
   * Aviso temprano de que un lote no da para tanto. El límite real lo aplica igual el backend al
   * resolver el desglose: esto solo evita que el operador confirme algo que no se va a cumplir.
   */
  private haySobreasignacionPorLote(): boolean {
    const excedida = this.filas.find((fila) => {
      const valor = Number(fila.control.value);
      return !isNaN(valor) && valor > 0 && valor - fila.disponible > EPSILON;
    });
    if (excedida) {
      this.notificacionService.openWarn(
        `El lote ${excedida.numeroLote} solo tiene ${excedida.disponibleLabel} disponible`
      );
      return true;
    }
    return false;
  }

  private asignacionElegida(): { loteId: number; cantidad: number }[] {
    const elegidos: { loteId: number; cantidad: number }[] = [];
    this.filas.forEach((fila) => {
      const valor = Number(fila.control.value);
      if (!isNaN(valor) && valor > 0) {
        elegidos.push({ loteId: fila.loteId, cantidad: valor });
      }
    });
    return elegidos;
  }

  onCancelar(): void {
    this.dialogRef.close(null);
  }

  /**
   * Cantidades sin separador de miles: un saldo de 3000 se lee mejor como "3000" que como
   * "3.000", que en es-PY se confunde con un decimal. Se respeta el separador decimal del
   * locale, porque una presentación de varias unidades da cantidades fraccionarias.
   */
  private formatearCantidad(valor: number): string {
    return (valor || 0).toLocaleString(this.locale, {
      useGrouping: false,
      maximumFractionDigits: 3
    });
  }

  private fechaCorta(fecha: Date): string {
    return fecha ? dateToString(fecha, 'dd/MM/yyyy') : '-';
  }

  private claseSegunEstado(estado: EstadoLote): string {
    if (estado === EstadoLote.BLOQUEADO) return 'estado-bloqueado';
    if (estado === EstadoLote.CUARENTENA) return 'estado-cuarentena';
    return 'estado-liberado';
  }
}
