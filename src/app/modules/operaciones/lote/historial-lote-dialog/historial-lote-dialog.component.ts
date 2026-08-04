import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { PageInfo } from '../../../../app.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { MovimientoLote } from '../lote.model';
import { LoteService } from '../lote.service';

export interface HistorialLoteDialogData {
  loteId: number;
  numeroLote: string;
  productoDescripcion: string;
  /** Sucursal filtrada en el listado, para que el diálogo abra con el mismo recorte. */
  sucursal?: Sucursal;
}

/**
 * Fila de la tabla. Todo lo derivado se precalcula acá: el template no debe llamar funciones ni
 * comparar, porque Angular reevalúa esas expresiones en cada ciclo de detección de cambios.
 */
interface MovimientoRow {
  fechaLabel: string;
  sucursalNombre: string;
  tipoLabel: string;
  tipoClase: string;
  referenciaLabel: string;
  cantidadLabel: string;
  cantidadClase: string;
  usuarioNombre: string;
}

/**
 * "Historial del lote": de dónde vino y a dónde fue.
 *
 * Es la contraparte del bloqueo por recall. Sacar el lote de circulación se resuelve con
 * cambiarEstadoLote desde el listado; para avisar hace falta poder recorrer la compra que lo
 * trajo, las transferencias que lo repartieron y las ventas que lo sacaron.
 *
 * Va en diálogo y no en la fila expandible del listado porque necesita paginación propia: un lote
 * de rotación alta acumula una fila por venta.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-historial-lote-dialog',
  templateUrl: './historial-lote-dialog.component.html',
  styleUrls: ['./historial-lote-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistorialLoteDialogComponent implements OnInit {

  displayedColumns = ['fecha', 'sucursal', 'tipo', 'documento', 'cantidad', 'usuario'];

  movimientos: MovimientoRow[] = [];
  sucursales: Sucursal[] = [];
  sucursalControl = new FormControl<Sucursal>(null);

  numeroLote = '';
  productoDescripcion = '';

  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;
  cargando = false;
  sinMovimientos = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: HistorialLoteDialogData,
    private dialogRef: MatDialogRef<HistorialLoteDialogComponent>,
    private loteService: LoteService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.numeroLote = this.data?.numeroLote || '';
    this.productoDescripcion = this.data?.productoDescripcion || '';
    // Arranca con el mismo recorte que traía el listado: si el operador venía mirando una
    // sucursal, el historial no debería contradecir lo que tenía en pantalla.
    this.sucursalControl.setValue(this.data?.sucursal || null);
    this.cargarSucursales();
    this.buscar();
  }

  private cargarSucursales(): void {
    this.sucursalService.onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.sucursales = res.filter((sucursal) => sucursal.activo !== false);
          this.cdr.markForCheck();
        }
      });
  }

  onSucursalChange(): void {
    this.pageIndex = 0;
    this.buscar();
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.buscar();
  }

  private buscar(): void {
    const loteId = this.data?.loteId;
    if (loteId == null) {
      return;
    }
    this.cargando = true;
    this.loteService
      .onMovimientosPorLote(
        loteId,
        this.sucursalControl.value?.id,
        this.pageIndex,
        this.pageSize
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: PageInfo<MovimientoLote>) => {
          const contenido = res?.getContent || [];
          this.totalElements = res?.getTotalElements || 0;
          this.movimientos = contenido.map((item) => this.mapearFila(item));
          this.sinMovimientos = contenido.length === 0;
          this.cargando = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.cargando = false;
          this.notificacionService.openAlgoSalioMal('Error al consultar el historial del lote');
          this.cdr.markForCheck();
        }
      });
  }

  private mapearFila(item: MovimientoLote): MovimientoRow {
    const cantidad = item.cantidad || 0;
    return {
      fechaLabel: item.fecha ? dateToString(item.fecha, 'dd/MM/yyyy HH:mm') : '-',
      sucursalNombre: (item.sucursalNombre || this.referenciaSinNombre(item.sucursalId)).toUpperCase(),
      tipoLabel: item.tipoMovimiento || 'SIN TIPO',
      tipoClase: this.claseSegunTipo(item.tipoMovimiento),
      referenciaLabel: item.referencia != null ? `#${item.referencia}` : '-',
      // El signo se muestra siempre: la lectura del historial es "entró / salió", no "cuánto".
      cantidadLabel: `${cantidad > 0 ? '+' : ''}${cantidad}`,
      cantidadClase: cantidad < 0 ? 'cantidad-salida' : 'cantidad-entrada',
      usuarioNombre: item.usuarioNombre || '-'
    };
  }

  private referenciaSinNombre(id: number): string {
    return id != null ? `#${id}` : '-';
  }

  private claseSegunTipo(tipo: string): string {
    if (tipo === 'COMPRA') return 'tipo-compra';
    if (tipo === 'VENTA') return 'tipo-venta';
    if (tipo === 'TRANSFERENCIA') return 'tipo-transferencia';
    if (tipo === 'AJUSTE') return 'tipo-ajuste';
    return 'tipo-desconocido';
  }

  onCerrar(): void {
    this.dialogRef.close();
  }
}
