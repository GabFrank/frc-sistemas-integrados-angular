import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime } from 'rxjs/operators';

import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { ESTADO_LOTE_LABELS, EstadoLote, StockLote } from '../../lote/lote.model';
import { LoteService } from '../../lote/lote.service';
import { EtapaAsignacionLote, TransferenciaItemLote } from '../transferencia.model';

export interface SeleccionarLotesDialogData {
  productoId: number;
  productoDescripcion: string;
  sucursalOrigenId: number;
  sucursalOrigenNombre: string;
  /** Cantidad total del ítem, en unidades. Es lo que hay que repartir entre los lotes. */
  cantidad: number;
  etapa: EtapaAsignacionLote;
  /** Asignación ya guardada, para poder editarla en vez de arrancar de cero. */
  asignacionActual?: TransferenciaItemLote[];
}

/** Lo que devuelve el diálogo al cerrarse con "Confirmar". */
export interface SeleccionarLotesDialogResult {
  lotes: { loteId: number; cantidad: number }[];
  etapa: EtapaAsignacionLote;
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
  disponible: number;
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

  productoDescripcion = '';
  sucursalOrigenNombre = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarLotesDialogData,
    private dialogRef: MatDialogRef<SeleccionarLotesDialogComponent>,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cantidadRequerida = this.data?.cantidad || 0;
    this.productoDescripcion = this.data?.productoDescripcion || '';
    this.sucursalOrigenNombre = this.data?.sucursalOrigenNombre || '';
    this.cargarLotes();
  }

  private cargarLotes(): void {
    this.loteService
      .onGetStockPorLote(this.data.productoId, this.data.sucursalOrigenId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: StockLote[]) => {
          const lotes = res || [];
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

  private crearFila(lote: StockLote): LoteRow {
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
      disponible: lote.cantidadDisponible,
      seleccionable,
      control
    };
  }

  /** Cantidad que ya tenía asignada este lote, para precargar el diálogo al reeditar. */
  private cantidadPreviaDe(loteId: number): number {
    const previa = (this.data?.asignacionActual || []).find((a) => a.loteId === loteId);
    return previa ? previa.cantidad : null;
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
    this.faltante = this.cantidadRequerida - total;
    this.hayFaltante = this.faltante > 0;
    this.excedeRequerido = this.faltante < 0;

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
      const aTomar = pendiente > 0 ? Math.min(fila.disponible, pendiente) : null;
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
    if (this.haySobreasignacionPorLote()) {
      return;
    }
    this.dialogRef.close({
      lotes: this.asignacionElegida(),
      etapa: this.data.etapa
    } as SeleccionarLotesDialogResult);
  }

  /** Nadie puede sacar de un lote más de lo que ese lote tiene. */
  private haySobreasignacionPorLote(): boolean {
    const excedida = this.filas.find((fila) => {
      const valor = Number(fila.control.value);
      return !isNaN(valor) && valor > 0 && valor > fila.disponible;
    });
    if (excedida) {
      this.notificacionService.openWarn(
        `El lote ${excedida.numeroLote} solo tiene ${excedida.disponible} disponible`
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

  private fechaCorta(fecha: Date): string {
    return fecha ? dateToString(fecha, 'dd/MM/yyyy') : '-';
  }

  private claseSegunEstado(estado: EstadoLote): string {
    if (estado === EstadoLote.BLOQUEADO) return 'estado-bloqueado';
    if (estado === EstadoLote.CUARENTENA) return 'estado-cuarentena';
    return 'estado-liberado';
  }
}
