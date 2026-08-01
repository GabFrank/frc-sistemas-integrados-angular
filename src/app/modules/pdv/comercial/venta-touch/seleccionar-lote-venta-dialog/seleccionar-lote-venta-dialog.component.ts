import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { PageInfo } from '../../../../../app.component';
import { dateToString } from '../../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { StockLotePresentacion } from '../../../../operaciones/lote/lote.model';
import { LoteService } from '../../../../operaciones/lote/lote.service';
import { VentaItemLoteInput } from '../../../../operaciones/venta/venta-item.model';

/** Tolerancia al comparar cantidades en punto flotante. */
const EPSILON = 0.0001;

export interface SeleccionarLoteVentaDialogData {
  productoId: number;
  productoDescripcion: string;
  presentacionId: number;
  sucursalId: number;
  /** Cantidad a cubrir, EN PRESENTACIONES: la misma unidad que ve el cajero. */
  cantidad: number;
}

/** Lo que devuelve el diálogo. Lista vacía = FEFO automático. */
export interface SeleccionarLoteVentaDialogResult {
  lotes: VentaItemLoteInput[];
}

/**
 * Fila de la tabla. Todo lo derivado se precalcula acá: el template solo lee propiedades, nunca
 * llama funciones ni getters.
 */
interface LoteRow {
  loteId: number;
  numeroLote: string;
  vencimientoLabel: string;
  retiroLabel: string;
  /** Presentaciones completas disponibles. Es el techo de lo que se puede pedir de este lote. */
  disponible: number;
  disponibleLabel: string;
  /** Cantidad que el cajero decidió sacar de este lote, en presentaciones. */
  cantidad: number;
  seleccionado: boolean;
  /** Precalculado para resaltar lo que hay que sacar antes, sin lógica en el template. */
  clase: string;
}

/**
 * Selector de lote para la venta.
 *
 * Abre con FEFO preseleccionado: confirmar sin tocar nada es la venta normal y no cambia el ritmo
 * del POS. Elegir lotes a mano es la excepción deliberada, y aun así el backend recorta cada
 * elección al saldo real y completa el faltante por FEFO.
 *
 * Si el producto tiene control de lote pero no hay stock por lote (mercadería cargada antes de que
 * el producto lo tuviera), el diálogo avisa y deja vender igual: la venta nunca se bloquea por
 * datos de lote incompletos.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-seleccionar-lote-venta-dialog',
  templateUrl: './seleccionar-lote-venta-dialog.component.html',
  styleUrls: ['./seleccionar-lote-venta-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeleccionarLoteVentaDialogComponent implements OnInit {

  readonly displayedColumns = ['seleccion', 'numeroLote', 'vencimiento', 'retiro', 'disponible', 'cantidad'];

  filas: LoteRow[] = [];

  /** Modo activo. Arranca en FEFO: es el camino de casi todas las ventas. */
  modoFefo = true;

  cargando = true;
  sinLotes = false;

  /** Todo precalculado para el template. */
  productoDescripcion = '';
  cantidadRequerida = 0;
  totalSeleccionado = 0;
  faltanteLabel = '';
  hayFaltante = false;
  puedeConfirmar = true;
  mensajeSinLotes = '';

  constructor(
    private dialogRef: MatDialogRef<SeleccionarLoteVentaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SeleccionarLoteVentaDialogData,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.productoDescripcion = data?.productoDescripcion || '';
    this.cantidadRequerida = data?.cantidad || 0;
  }

  ngOnInit(): void {
    this.cargarLotes();
  }

  /**
   * Los lotes se piden al servidor FILIAL (servidor = false): es donde vive el stock de esta
   * sucursal y donde la venta va a resolver FEFO. Pedirlos al central daría un saldo que no es el
   * que se va a descontar.
   */
  private cargarLotes(): void {
    this.loteService
      .onGetStockPorLoteEnPresentacion(
        this.data.productoId,
        this.data.sucursalId,
        this.data.presentacionId,
        null,
        0,
        100,
        false,
        true
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: PageInfo<StockLotePresentacion>) => {
          const contenido = res?.getContent || [];
          this.filas = contenido.map((lote) => this.mapearFila(lote));
          this.sinLotes = this.filas.length === 0;
          this.mensajeSinLotes = this.sinLotes
            ? 'Este producto tiene control de lote pero no hay stock por lote en esta sucursal. '
              + 'La venta se puede completar igual y quedará sin trazabilidad de lote.'
            : '';
          this.cargando = false;
          this.recalcular();
        },
        error: () => {
          this.cargando = false;
          this.sinLotes = true;
          this.mensajeSinLotes = 'No se pudo consultar el stock por lote. La venta se puede '
            + 'completar igual, por FEFO automático.';
          this.notificacionService.openAlgoSalioMal('Error al consultar el stock por lote');
          this.recalcular();
        }
      });
  }

  private mapearFila(lote: StockLotePresentacion): LoteRow {
    const disponible = lote.cantidadDisponiblePresentacion || 0;
    return {
      loteId: lote.loteId,
      numeroLote: lote.numeroLote || '-',
      vencimientoLabel: this.fechaCorta(lote.fechaVencimiento),
      retiroLabel: this.fechaCorta(lote.fechaRetiro),
      disponible,
      disponibleLabel: `${disponible}`,
      cantidad: 0,
      seleccionado: false,
      clase: this.claseSegunFecha(lote)
    };
  }

  private fechaCorta(fecha: Date): string {
    return fecha ? dateToString(fecha, 'dd/MM/yyyy') : '-';
  }

  /** Resalta lo que hay que sacar antes. Se calcula una vez por fila, no en el template. */
  private claseSegunFecha(lote: StockLotePresentacion): string {
    const referencia = lote.fechaRetiro || lote.fechaVencimiento;
    if (!referencia) return '';
    const dias = Math.floor((new Date(referencia).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return 'fila-vencida';
    if (dias <= 30) return 'fila-por-vencer';
    return '';
  }

  /** Vuelve a FEFO: se descarta lo elegido a mano. */
  activarFefo(): void {
    this.modoFefo = true;
    this.filas.forEach((fila) => {
      fila.seleccionado = false;
      fila.cantidad = 0;
    });
    this.recalcular();
  }

  activarManual(): void {
    this.modoFefo = false;
    this.recalcular();
  }

  /**
   * Al marcar un lote se propone lo que falta cubrir, acotado a lo disponible. Es lo que el cajero
   * quiere el 90% de las veces y le ahorra tipear.
   */
  alternarLote(fila: LoteRow): void {
    fila.seleccionado = !fila.seleccionado;
    if (fila.seleccionado) {
      const pendiente = this.cantidadRequerida - this.totalSeleccionado;
      fila.cantidad = Math.max(0, Math.min(fila.disponible, pendiente));
    } else {
      fila.cantidad = 0;
    }
    this.recalcular();
  }

  cambiarCantidad(fila: LoteRow, valor: string): void {
    const cantidad = Number(valor);
    fila.cantidad = isNaN(cantidad) || cantidad < 0 ? 0 : Math.min(cantidad, fila.disponible);
    fila.seleccionado = fila.cantidad > 0;
    this.recalcular();
  }

  private recalcular(): void {
    this.totalSeleccionado = this.filas.reduce((total, fila) => total + (fila.cantidad || 0), 0);
    const faltante = this.cantidadRequerida - this.totalSeleccionado;
    this.hayFaltante = !this.modoFefo && faltante > EPSILON;
    this.faltanteLabel = this.hayFaltante
      ? `Faltan ${faltante} — el resto lo completa FEFO automáticamente.`
      : '';
    // Siempre se puede confirmar: en FEFO no hay nada que elegir, y en manual lo que falte lo
    // resuelve el backend. Bloquear acá dejaría al cajero sin salida.
    this.puedeConfirmar = true;
    this.cdr.markForCheck();
  }

  confirmar(): void {
    if (this.modoFefo) {
      this.dialogRef.close({ lotes: [] } as SeleccionarLoteVentaDialogResult);
      return;
    }
    const lotes: VentaItemLoteInput[] = this.filas
      .filter((fila) => fila.cantidad > EPSILON)
      .map((fila) => ({ loteId: fila.loteId, cantidad: fila.cantidad }));
    this.dialogRef.close({ lotes } as SeleccionarLoteVentaDialogResult);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
