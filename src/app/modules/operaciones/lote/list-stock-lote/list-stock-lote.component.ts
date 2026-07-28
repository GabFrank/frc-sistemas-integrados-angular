import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PageInfo } from '../../../../app.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { ESTADO_LOTE_LABELS, EstadoLote, StockLote } from '../lote.model';
import { LoteService } from '../lote.service';

/**
 * Fila de la tabla. Los valores derivados se precalculan acá y no en el template, porque Angular
 * reevalúa las expresiones del template en cada ciclo de detección de cambios.
 */
interface StockLoteRow {
  loteId: number;
  productoDescripcion: string;
  sucursalNombre: string;
  numeroLote: string;
  fechaVencimiento: Date;
  fechaRetiro: Date;
  estadoLabel: string;
  estadoClase: string;
  cantidadDisponible: number;
  filaClase: string;
}

/**
 * Pantalla "Stock por lotes": responde "¿dónde tengo qué?".
 *
 * El saldo se deriva del ledger operaciones.movimiento_stock_lote y se resuelve contra el maestro
 * operaciones.lote. El orden por defecto es FEFO: lo que hay que sacar primero aparece primero.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-stock-lote',
  templateUrl: './list-stock-lote.component.html',
  styleUrls: ['./list-stock-lote.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListStockLoteComponent implements OnInit {

  displayedColumns = [
    'producto', 'sucursal', 'numeroLote', 'fechaVencimiento', 'fechaRetiro', 'estado', 'cantidad'
  ];

  dataSource = new MatTableDataSource<StockLoteRow>([]);
  filtros: FormGroup;

  sucursales: Sucursal[] = [];
  readonly estados = [EstadoLote.LIBERADO, EstadoLote.CUARENTENA, EstadoLote.BLOQUEADO];
  readonly estadoLabels = ESTADO_LOTE_LABELS;

  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;
  sinResultados = false;

  constructor(
    private loteService: LoteService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionSnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    this.filtros = new FormGroup({
      texto: new FormControl(null),
      numeroLote: new FormControl(null),
      sucursal: new FormControl(null),
      estado: new FormControl(null),
      vencimientoHasta: new FormControl(null)
    });
  }

  ngOnInit(): void {
    this.cargarSucursales();

    // El filtro de texto se dispara solo, con debounce para no consultar en cada tecla.
    this.filtros.get('texto').valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => this.onBuscar(true));

    this.onBuscar();
  }

  private cargarSucursales(): void {
    this.sucursalService.onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.sucursales = res;
          this.cdr.markForCheck();
        }
      });
  }

  onBuscar(reiniciarPagina = false, silentLoad = false): void {
    if (reiniciarPagina) {
      this.pageIndex = 0;
    }

    const valores = this.filtros.value;
    this.loteService
      .onBuscarStockPorLote(
        {
          sucursalId: valores.sucursal?.id,
          estado: valores.estado,
          numeroLote: valores.numeroLote,
          texto: valores.texto,
          vencimientoHasta: valores.vencimientoHasta
            ? dateToString(valores.vencimientoHasta, 'yyyy-MM-dd')
            : null
        },
        this.pageIndex,
        this.pageSize,
        true,
        silentLoad
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: PageInfo<StockLote>) => {
          const contenido = res?.getContent || [];
          this.totalElements = res?.getTotalElements || 0;
          this.dataSource.data = contenido.map((item) => this.mapearFila(item));
          this.sinResultados = contenido.length === 0;
          this.cdr.markForCheck();
        },
        error: () => {
          this.notificacionService.openAlgoSalioMal('Error al consultar el stock por lotes');
          this.cdr.markForCheck();
        }
      });
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.onBuscar(false, true);
  }

  onLimpiarFiltros(): void {
    this.filtros.reset();
    this.onBuscar(true);
  }

  private mapearFila(item: StockLote): StockLoteRow {
    const estado = item.estado;
    return {
      loteId: item.loteId,
      productoDescripcion: item.productoDescripcion || `#${item.productoId}`,
      sucursalNombre: item.sucursalNombre || `#${item.sucursalId}`,
      numeroLote: item.numeroLote,
      fechaVencimiento: item.fechaVencimiento,
      fechaRetiro: item.fechaRetiro,
      estadoLabel: ESTADO_LOTE_LABELS[estado] || estado || '-',
      estadoClase: this.claseSegunEstado(estado),
      cantidadDisponible: item.cantidadDisponible,
      filaClase: this.claseSegunVencimiento(item)
    };
  }

  private claseSegunEstado(estado: EstadoLote): string {
    if (estado === EstadoLote.BLOQUEADO) return 'estado-bloqueado';
    if (estado === EstadoLote.CUARENTENA) return 'estado-cuarentena';
    return 'estado-liberado';
  }

  /**
   * Resalta las filas cuya fecha de retiro ya pasó o está por vencer. La comparación se hace acá,
   * una vez por fila, y no en el template.
   */
  private claseSegunVencimiento(item: StockLote): string {
    const referencia = item.fechaRetiro || item.fechaVencimiento;
    if (!referencia) return '';
    const hoy = new Date();
    const fecha = new Date(referencia);
    const diasRestantes = Math.floor((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diasRestantes < 0) return 'fila-vencida';
    if (diasRestantes <= 30) return 'fila-por-vencer';
    return '';
  }
}
