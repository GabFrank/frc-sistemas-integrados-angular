import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import {
  ESTADO_LOTE_LABELS,
  EstadoLote,
  Lote
} from '../../../operaciones/lote/lote.model';
import { LoteService } from '../../../operaciones/lote/lote.service';
import { Producto } from '../producto.model';

export interface LotesProductoDialogData {
  producto: Producto;
}

/**
 * Fila de la tabla. Los campos derivados se precalculan acá y no en el template, porque Angular
 * reevalúa las expresiones del template en cada ciclo de detección de cambios.
 */
interface LoteRow {
  id: number;
  numeroLote: string;
  fechaVencimiento: Date;
  fechaRetiro: Date;
  estado: EstadoLote;
  estadoLabel: string;
  estadoClase: string;
  proveedorNombre: string;
  observacion: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-lotes-producto-dialog',
  templateUrl: './lotes-producto-dialog.component.html',
  styleUrls: ['./lotes-producto-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LotesProductoDialogComponent implements OnInit {

  displayedColumns = ['numeroLote', 'fechaVencimiento', 'fechaRetiro', 'proveedor', 'estado', 'acciones'];

  lotes: LoteRow[] = [];
  cargando = false;
  sinLotes = false;
  descripcionProducto = '';

  readonly estados = [EstadoLote.LIBERADO, EstadoLote.CUARENTENA, EstadoLote.BLOQUEADO];
  readonly estadoLabels = ESTADO_LOTE_LABELS;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LotesProductoDialogData,
    private dialogRef: MatDialogRef<LotesProductoDialogComponent>,
    private loteService: LoteService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.descripcionProducto = this.data?.producto?.descripcion || '';
    this.cargarLotes();
  }

  private cargarLotes(): void {
    const productoId = this.data?.producto?.id;
    if (!productoId) {
      return;
    }
    this.cargando = true;
    this.loteService
      .onGetLotesPorProducto(productoId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          this.lotes = (res || []).map((lote) => this.mapearFila(lote));
          this.sinLotes = this.lotes.length === 0;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.notificacionService.openAlgoSalioMal('Error al cargar los lotes del producto');
          this.cdr.markForCheck();
        }
      });
  }

  private mapearFila(lote: Lote): LoteRow {
    return {
      id: lote.id,
      numeroLote: lote.numeroLote,
      fechaVencimiento: lote.fechaVencimiento,
      fechaRetiro: lote.fechaRetiro,
      estado: lote.estado,
      estadoLabel: ESTADO_LOTE_LABELS[lote.estado] || lote.estado,
      estadoClase: this.claseSegunEstado(lote.estado),
      proveedorNombre: lote.proveedor?.persona?.nombre || '-',
      observacion: lote.observacion || ''
    };
  }

  private claseSegunEstado(estado: EstadoLote): string {
    if (estado === EstadoLote.BLOQUEADO) return 'estado-bloqueado';
    if (estado === EstadoLote.CUARENTENA) return 'estado-cuarentena';
    return 'estado-liberado';
  }

  /**
   * Cambia el estado de un lote. Bloquear es una acción con impacto en todas las sucursales,
   * así que se confirma antes.
   */
  onCambiarEstado(fila: LoteRow, estado: EstadoLote): void {
    if (fila.estado === estado) {
      return;
    }

    const mensaje = estado === EstadoLote.LIBERADO
      ? `El lote ${fila.numeroLote} vuelve a estar disponible para la venta en todas las sucursales.`
      : `El lote ${fila.numeroLote} dejará de venderse en TODAS las sucursales. El stock físico no se modifica: la mercadería sigue existiendo y se sigue contando en el inventario.`;

    this.dialogosService
      .confirm(
        `Cambiar estado a ${ESTADO_LOTE_LABELS[estado]}`,
        mensaje,
        'Los cambios se replican a las sucursales automáticamente.',
        undefined,
        true,
        'Confirmar',
        'Cancelar'
      )
      .pipe(untilDestroyed(this))
      .subscribe((confirmado) => {
        if (confirmado) {
          this.aplicarCambioDeEstado(fila, estado);
        }
      });
  }

  private aplicarCambioDeEstado(fila: LoteRow, estado: EstadoLote): void {
    this.loteService
      .onCambiarEstadoLote(fila.id, estado, fila.observacion, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res) {
            this.notificacionService.openSucess('Estado del lote actualizado');
            this.cargarLotes();
          }
        },
        error: () => {
          this.notificacionService.openAlgoSalioMal('Error al cambiar el estado del lote');
        }
      });
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
