import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PageInfo } from '../../../../app.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { MainService } from '../../../../main.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { ESTADO_LOTE_LABELS, EstadoLote, StockLote, StockLoteSucursal } from '../lote.model';
import { LoteService } from '../lote.service';

/** Fila del desglose por sucursal que se abre al expandir un lote. */
interface SucursalStockRow {
  sucursalId: number;
  nombre: string;
  cantidadDisponible: number;
  /** Precalculado para atenuar las sucursales donde el lote no está, sin lógica en el template. */
  sinStock: boolean;
}

/**
 * Fila de la tabla. Los valores derivados se precalculan acá y no en el template, porque Angular
 * reevalúa las expresiones del template en cada ciclo de detección de cambios.
 *
 * La fila es el LOTE: el saldo es el de todas las sucursales sumadas (o el de la sucursal
 * filtrada, si hay una). El reparto se ve expandiendo la fila.
 */
interface StockLoteRow {
  loteId: number;
  productoDescripcion: string;
  numeroLote: string;
  fechaVencimientoLabel: string;
  fechaRetiroLabel: string;
  estadoLabel: string;
  estadoClase: string;
  cantidadDisponible: number;
  filaClase: string;
  /** Estado de la animación, precalculado para no evaluar comparaciones en el template. */
  estadoDetalle: 'expanded' | 'collapsed';
  /** Null mientras no se pidió el desglose: es lo que dispara el spinner. */
  sucursales: SucursalStockRow[];
}

/** Opción del combo de estado, con su etiqueta ya resuelta. */
interface OpcionEstado {
  valor: EstadoLote;
  label: string;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class ListStockLoteComponent implements OnInit {

  titulo = 'Stock por lotes';

  displayedColumns = [
    'producto', 'numeroLote', 'fechaVencimiento', 'fechaRetiro', 'estado', 'cantidad'
  ];

  dataSource = new MatTableDataSource<StockLoteRow>([]);
  filtros: FormGroup;

  sucursales: Sucursal[] = [];

  /** Lote abierto. Solo uno a la vez, igual que en la lista de productos. */
  filaExpandida: StockLoteRow = null;

  /** Cambia según haya o no filtro de sucursal. Precalculado: el template solo lo lee. */
  tituloDetalle = 'Stock por Sucursal';

  /** La sucursal COMPRAS solo se muestra a quien tiene el rol. */
  private puedeVerStockCompras = false;

  /** Etiquetas resueltas una sola vez: el template no debe indexar mapas en cada ciclo. */
  readonly opcionesEstado: OpcionEstado[] = [
    { valor: EstadoLote.LIBERADO, label: ESTADO_LOTE_LABELS[EstadoLote.LIBERADO] },
    { valor: EstadoLote.CUARENTENA, label: ESTADO_LOTE_LABELS[EstadoLote.CUARENTENA] },
    { valor: EstadoLote.BLOQUEADO, label: ESTADO_LOTE_LABELS[EstadoLote.BLOQUEADO] }
  ];

  pageIndex = 0;
  pageSize = 15;
  totalElements = 0;
  sinResultados = false;
  isSearching = false;

  constructor(
    private loteService: LoteService,
    private sucursalService: SucursalService,
    private notificacionService: NotificacionSnackbarService,
    private mainService: MainService,
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
    this.puedeVerStockCompras =
      this.mainService.usuarioActual?.roles?.includes(ROLES.ADMIN) ||
      this.mainService.usuarioActual?.roles?.includes(ROLES.VER_STOCK_COMPRAS) ||
      false;

    this.cargarSucursales();

    // El filtro de texto se dispara solo, con debounce para no consultar en cada tecla.
    this.filtros.get('texto').valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), untilDestroyed(this))
      .subscribe(() => this.onFiltrar(true));

    this.onBuscar();
  }

  /**
   * Solo sucursales activas, el mismo criterio con el que el backend arma el desglose por
   * sucursal. Ofrecer una sucursal dada de baja en el filtro dejaría el panel vacío al elegirla.
   */
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

  /** Vuelve a la primera página y busca. Es lo que dispara el botón "Buscar" del listado. */
  onFiltrar(silentLoad = false): void {
    this.pageIndex = 0;
    this.onBuscar(silentLoad);
  }

  onBuscar(silentLoad = false): void {
    const valores = this.filtros.value;
    this.isSearching = true;
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
          // Las filas se reconstruyen, así que el desglose ya cargado se descarta con ellas.
          this.filaExpandida = null;
          this.tituloDetalle = valores.sucursal
            ? 'Stock en Sucursal Seleccionada'
            : 'Stock por Sucursal';
          this.dataSource.data = contenido.map((item) => this.mapearFila(item));
          this.sinResultados = contenido.length === 0;
          this.isSearching = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSearching = false;
          this.notificacionService.openAlgoSalioMal('Error al consultar el stock por lotes');
          this.cdr.markForCheck();
        }
      });
  }

  handlePageEvent(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.onBuscar(true);
  }

  resetFiltro(): void {
    this.filtros.reset();
    this.onFiltrar();
  }

  /**
   * Abre o cierra el desglose por sucursal del lote. Solo puede haber uno abierto: dos paneles
   * abiertos obligan a comparar cantidades que están lejos entre sí en pantalla.
   */
  onFilaClick(fila: StockLoteRow): void {
    const estabaAbierta = this.filaExpandida === fila;

    if (this.filaExpandida != null) {
      this.filaExpandida.estadoDetalle = 'collapsed';
    }

    if (estabaAbierta) {
      this.filaExpandida = null;
      this.cdr.markForCheck();
      return;
    }

    fila.estadoDetalle = 'expanded';
    this.filaExpandida = fila;

    // Ya se pidió antes: la fila conserva el desglose mientras no se rehaga la búsqueda.
    if (fila.sucursales == null) {
      this.cargarSucursalesDelLote(fila);
    }
    this.cdr.markForCheck();
  }

  private cargarSucursalesDelLote(fila: StockLoteRow): void {
    this.loteService
      .onStockLotePorSucursal(fila.loteId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: StockLoteSucursal[]) => {
          fila.sucursales = this.mapearSucursales(res || []);
          this.cdr.markForCheck();
        },
        error: () => {
          fila.sucursales = [];
          this.notificacionService.openAlgoSalioMal('Error al consultar el stock por sucursal');
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Arma el desglose visible. Con una sucursal filtrada se muestra solo esa, para que el panel
   * diga lo mismo que la columna "Disponible", que también está restringida al filtro.
   */
  private mapearSucursales(items: StockLoteSucursal[]): SucursalStockRow[] {
    const sucursalFiltrada = this.filtros.value.sucursal;
    return items
      .filter((item) => this.sucursalVisible(item, sucursalFiltrada))
      .map((item) => ({
        sucursalId: item.sucursalId,
        nombre: (item.sucursalNombre || this.referenciaSinNombre(item.sucursalId)).toUpperCase(),
        cantidadDisponible: item.cantidadDisponible || 0,
        sinStock: !item.cantidadDisponible
      }));
  }

  private sucursalVisible(item: StockLoteSucursal, sucursalFiltrada: Sucursal): boolean {
    if (sucursalFiltrada != null) {
      return item.sucursalId === sucursalFiltrada.id;
    }
    // Mismo criterio que la lista de productos: SERVIDOR nunca, COMPRAS solo con el rol.
    if (item.sucursalNombre === 'SERVIDOR') return false;
    if (item.sucursalNombre === 'COMPRAS' && !this.puedeVerStockCompras) return false;
    return true;
  }

  private mapearFila(item: StockLote): StockLoteRow {
    const estado = item.estado;
    return {
      loteId: item.loteId,
      productoDescripcion: item.productoDescripcion || this.referenciaSinNombre(item.productoId),
      numeroLote: item.numeroLote || '-',
      fechaVencimientoLabel: this.fechaCorta(item.fechaVencimiento),
      fechaRetiroLabel: this.fechaCorta(item.fechaRetiro),
      estadoLabel: ESTADO_LOTE_LABELS[estado] || estado || '-',
      estadoClase: this.claseSegunEstado(estado),
      cantidadDisponible: item.cantidadDisponible,
      filaClase: this.claseSegunVencimiento(item),
      estadoDetalle: 'collapsed',
      sucursales: null
    };
  }

  /** Fallback cuando el backend no resolvió el nombre: mostrar el id sirve para reportar. */
  private referenciaSinNombre(id: number): string {
    return id != null ? `#${id}` : '-';
  }

  private fechaCorta(fecha: Date): string {
    return fecha ? dateToString(fecha, 'dd/MM/yyyy') : '-';
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
