import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { PageInfo } from '../../../../app.component';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { MainService } from '../../../../main.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { ROLES } from '../../../personas/roles/roles.enum';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { ProveedorService } from '../../../personas/proveedor/proveedor.service';
import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { SucursalService } from '../../../empresarial/sucursal/sucursal.service';
import { HistorialLoteDialogComponent } from '../historial-lote-dialog/historial-lote-dialog.component';
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
  proveedorNombre: string;
  fechaVencimientoLabel: string;
  fechaRetiroLabel: string;
  /** Estado sin resolver: el menú de acciones deshabilita la opción que ya está aplicada. */
  estado: EstadoLote;
  estadoLabel: string;
  estadoClase: string;
  cantidadDisponible: number;
  filaClase: string;
  /**
   * Falso para el bucket "SIN LOTE", que no es un lote real sino el saldo que existe en el
   * agregado y no está atribuido a ninguno: no tiene fila en el maestro, así que no hay estado
   * que cambiarle.
   */
  esLoteReal: boolean;
  /** Estado de la animación, precalculado para no evaluar comparaciones en el template. */
  estadoDetalle: 'expanded' | 'collapsed';
  /** Null mientras no se pidió el desglose: es lo que dispara el spinner. */
  sucursales: SucursalStockRow[];
}

/** Opción de estado, con etiqueta, ícono y su color ya resueltos. Sirve al filtro y al menú. */
interface OpcionEstado {
  valor: EstadoLote;
  label: string;
  icono: string;
  claseIcono: string;
}

/**
 * Atajo de urgencia, el que prenden los dos botones de color. Son excluyentes entre sí porque los
 * dos se resuelven contra el mismo tope del backend (vencimientoHasta), que es el único corte por
 * fecha que expone la consulta.
 *
 * POR_VENCER es acumulativo a propósito: "lo que hay que sacar dentro de 30 días" incluye lo que
 * ya venció. Filtrar solo la franja naranja necesitaría un piso, que el backend no tiene.
 */
type FiltroVencimiento = 'VENCIDO' | 'POR_VENCER';

/** Ventana del atajo naranja. Es la misma con la que se pinta la fila. */
const DIAS_POR_VENCER = 30;

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
    'producto', 'numeroLote', 'proveedor', 'fechaVencimiento', 'fechaRetiro', 'estado',
    'cantidad', 'acciones'
  ];

  dataSource = new MatTableDataSource<StockLoteRow>([]);
  filtros: FormGroup;

  sucursales: Sucursal[] = [];

  /**
   * Proveedor elegido en el filtro. Se guarda aparte del form porque el campo de texto muestra la
   * etiqueta y lo que viaja al backend es el id.
   */
  proveedorSeleccionado: Proveedor = null;

  /** Atajo de urgencia activo, o null si no hay ninguno. Lo leen los dos botones de color. */
  filtroVencimiento: FiltroVencimiento = null;

  /** Lote abierto. Solo uno a la vez, igual que en la lista de productos. */
  filaExpandida: StockLoteRow = null;

  /** Cambia según haya o no filtro de sucursal. Precalculado: el template solo lo lee. */
  tituloDetalle = 'Stock por Sucursal';

  /** La sucursal COMPRAS solo se muestra a quien tiene el rol. */
  private puedeVerStockCompras = false;

  /** Etiquetas resueltas una sola vez: el template no debe indexar mapas en cada ciclo. */
  readonly opcionesEstado: OpcionEstado[] = [
    {
      valor: EstadoLote.LIBERADO,
      label: ESTADO_LOTE_LABELS[EstadoLote.LIBERADO],
      icono: 'check_circle',
      claseIcono: 'icono-liberado'
    },
    {
      valor: EstadoLote.CUARENTENA,
      label: ESTADO_LOTE_LABELS[EstadoLote.CUARENTENA],
      icono: 'pause_circle_filled',
      claseIcono: 'icono-cuarentena'
    },
    {
      valor: EstadoLote.BLOQUEADO,
      label: ESTADO_LOTE_LABELS[EstadoLote.BLOQUEADO],
      icono: 'block',
      claseIcono: 'icono-bloqueado'
    }
  ];

  pageIndex = 0;
  pageSize = 15;
  totalElements = 0;
  sinResultados = false;
  isSearching = false;

  constructor(
    private loteService: LoteService,
    private sucursalService: SucursalService,
    private proveedorService: ProveedorService,
    private notificacionService: NotificacionSnackbarService,
    private dialogosService: DialogosService,
    private matDialog: MatDialog,
    private mainService: MainService,
    private cdr: ChangeDetectorRef
  ) {
    this.filtros = new FormGroup({
      texto: new FormControl(null),
      numeroLote: new FormControl(null),
      // Solo la etiqueta visible del proveedor: el id sale de proveedorSeleccionado.
      proveedorTexto: new FormControl(null),
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
          proveedorId: this.proveedorSeleccionado?.id,
          estado: valores.estado,
          numeroLote: valores.numeroLote,
          texto: valores.texto,
          vencimientoHasta: this.resolverVencimientoHasta(valores.vencimientoHasta)
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
    this.proveedorSeleccionado = null;
    this.filtroVencimiento = null;
    this.onFiltrar();
  }

  /**
   * Los dos atajos de color y el datepicker son el mismo corte por fecha, así que solo puede haber
   * uno activo: el atajo gana y la fecha manual se limpia. Dejarlos convivir obligaría a decidir
   * en silencio cuál de los dos topes se aplica.
   */
  private resolverVencimientoHasta(fechaManual: Date): string {
    if (this.filtroVencimiento != null) {
      const limite = new Date();
      if (this.filtroVencimiento === 'POR_VENCER') {
        limite.setDate(limite.getDate() + DIAS_POR_VENCER);
      }
      return dateToString(limite, 'yyyy-MM-dd');
    }
    return fechaManual ? dateToString(fechaManual, 'yyyy-MM-dd') : null;
  }

  /** Prender el atajo que ya estaba activo lo apaga: es la única forma de volver a "todos". */
  onToggleVencimiento(filtro: FiltroVencimiento): void {
    this.filtroVencimiento = this.filtroVencimiento === filtro ? null : filtro;
    if (this.filtroVencimiento != null) {
      this.filtros.get('vencimientoHasta').setValue(null);
    }
    this.onFiltrar();
  }

  /** Elegir una fecha a mano apaga el atajo, que si no le pisaría el tope. */
  onVencimientoHastaChange(): void {
    this.filtroVencimiento = null;
    this.onFiltrar();
  }

  /**
   * Mismo patrón que el filtro de proveedor del listado de compras: el diálogo de búsqueda
   * paginado, con lo tipeado en el campo como búsqueda inicial.
   */
  onSearchProveedor(): void {
    if (this.proveedorSeleccionado != null) {
      return;
    }
    const texto = this.filtros.get('proveedorTexto').value?.trim() || null;
    this.proveedorService
      .onSearchProveedorPorTexto(texto)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res: Proveedor) => {
          if (res) {
            this.proveedorSeleccionado = res;
            this.filtros.get('proveedorTexto')
              .setValue(`${res.id} - ${res.persona?.nombre}`);
            this.onFiltrar();
          } else {
            this.filtros.get('proveedorTexto').setValue(null);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.filtros.get('proveedorTexto').setValue(null);
          this.notificacionService.openAlgoSalioMal('Error al buscar el proveedor');
          this.cdr.markForCheck();
        }
      });
  }

  onProveedorKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.proveedorSeleccionado == null) {
      event.preventDefault();
      this.onSearchProveedor();
    }
  }

  onClearProveedor(event: MouseEvent): void {
    event.stopPropagation();
    this.proveedorSeleccionado = null;
    this.filtros.get('proveedorTexto').setValue(null);
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

  /**
   * Evita que el click en el menú de acciones abra o cierre el desglose: el botón vive dentro de
   * la fila, que es clickeable entera.
   */
  onAccionesClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  /**
   * Abre el historial del lote: de qué compra vino, qué transferencias lo repartieron y qué
   * ventas lo sacaron.
   *
   * Es lo que hace utilizable el bloqueo de al lado. Bloquear saca el lote del mostrador, pero
   * para avisar hay que poder recorrer a dónde ya fue.
   *
   * Le pasa la sucursal filtrada para que el diálogo abra con el mismo recorte que el listado.
   */
  onVerHistorial(fila: StockLoteRow): void {
    if (!fila.esLoteReal) {
      return;
    }
    this.matDialog.open(HistorialLoteDialogComponent, {
      data: {
        loteId: fila.loteId,
        numeroLote: fila.numeroLote,
        productoDescripcion: fila.productoDescripcion,
        sucursal: this.filtros.value.sucursal
      },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh'
    });
  }

  /**
   * Cambia el estado del lote desde el listado, sin pasar por la ficha del producto: esta es la
   * pantalla donde se ve el lote vencido, así que también es donde tiene que poder bloquearse.
   *
   * Es la misma acción que ofrece el diálogo de lotes del producto y comparte su confirmación:
   * el impacto es en TODAS las sucursales, así que nunca se aplica de un solo click.
   */
  onCambiarEstado(fila: StockLoteRow, estado: EstadoLote): void {
    if (!fila.esLoteReal || fila.estado === estado) {
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

  /**
   * La observación va en null a propósito: el backend solo la pisa cuando llega un valor, así que
   * cambiar el estado desde acá conserva la que se haya cargado en la ficha del lote.
   *
   * Después se rehace la búsqueda en vez de actualizar la fila en memoria: con el filtro de estado
   * activo el lote puede tener que desaparecer del listado, y eso solo lo sabe el backend.
   */
  private aplicarCambioDeEstado(fila: StockLoteRow, estado: EstadoLote): void {
    this.loteService
      .onCambiarEstadoLote(fila.loteId, estado, null, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (res) => {
          if (res) {
            this.notificacionService.openSucess('Estado del lote actualizado');
            this.onBuscar(true);
          }
        },
        error: () => {
          this.notificacionService.openAlgoSalioMal('Error al cambiar el estado del lote');
        }
      });
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
      proveedorNombre: item.proveedorNombre || '-',
      fechaVencimientoLabel: this.fechaCorta(item.fechaVencimiento),
      fechaRetiroLabel: this.fechaCorta(item.fechaRetiro),
      estado,
      estadoLabel: ESTADO_LOTE_LABELS[estado] || estado || '-',
      estadoClase: this.claseSegunEstado(estado),
      cantidadDisponible: item.cantidadDisponible,
      filaClase: this.claseSegunVencimiento(item),
      esLoteReal: item.loteId != null,
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
