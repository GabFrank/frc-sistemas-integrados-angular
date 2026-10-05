import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { WindowInfoService } from "../../../../shared/services/window-info.service";
import {
  PdvSearchProductoData,
  PdvSearchProductoDialogComponent,
  PdvSearchProductoResponseData,
} from "../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../productos/producto/producto.model";
import { MovimientoStock } from "../movimiento-stock.model";
import { MovimientoStockService } from "../movimiento-stock.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { TipoMovimiento } from "../movimiento-stock.enums";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import {
  dateToString,
  getFirstDayOfCurrentWeek,
  getFirstDayOfMonths,
  getLastDayOfCurrentWeek,
  getLastDayOfMonths,
} from "../../../../commons/core/utils/dateUtils";
import { ProductoService } from "../../../productos/producto/producto.service";
import {
  SearchListDialogComponent,
  SearchListtDialogData,
} from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { UsuarioService } from "../../../personas/usuarios/usuario.service";
import { UsuarioSearchGQL } from "../../../personas/usuarios/graphql/usuarioSearch";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { PageInfo } from "../../../../app.component";
import { PageEvent } from "@angular/material/paginator";
import { Time } from "@angular/common";
import { stringToTime } from "../../../../commons/core/utils/string-utils";
import { StockPorTipoMovimientoDto } from "../graphql/getStockPorTipoMovimientoByFilters";
import { TabService, TabData } from "../../../../layouts/tab/tab.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { ListVentaComponent } from "../../venta/list-venta/list-venta.component";
import { VentaService } from "../../venta/venta.service";
import { TransferenciaService } from "../../transferencia/transferencia.service";
import { InventarioService } from "../../inventario/inventario.service";
import { Venta } from "../../venta/venta.model";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { EditTransferenciaComponent } from "../../transferencia/edit-transferencia/edit-transferencia.component";
import { ListInventarioComponent } from "../../inventario/list-inventario/list-inventario.component";
import { forkJoin, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ContextoConsulta, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from "../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../shared/services/timeout-link";

/**
 * Stock actual por sucursal para el resumen: el error de red y el del servidor llegan acá, sin aviso del servicio
 * (la pantalla avisa una sola vez por bloque). 60 s y sin modal: son N consultas en paralelo (#390).
 */
const LECTURA_STOCK_RESUMEN: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_RESUMEN: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };
/** Venta del movimiento: avisa la pantalla (una vez), no el servicio; el error del servidor también llega como error. */
const LECTURA_VENTA: QueryError = LECTURA_STOCK_RESUMEN;
const CONSULTA_DETALLE: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
/** Marca de «esta sucursal no respondió» dentro de un forkJoin (para no cortar las demás). */
const SIN_RESPUESTA = { sinRespuesta: true };

/**
 * Estado de un bloque del resumen. Un stock que no se pudo leer no se muestra como 0 ni como total parcial:
 * mientras carga o si falla alguna sucursal, el total queda «—» (#390).
 */
export type EstadoResumen = 'inicial' | 'sin-producto' | 'cargando' | 'ok' | 'no-disponible';

export interface StockResumenView {
  tipoMovimiento: string;
  stock: number;
  expanded?: { sucursal: string; stock: number} [];
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-movimiento-stock",
  templateUrl: "./list-movimiento-stock.component.html",
  styleUrls: ["./list-movimiento-stock.component.scss"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListMovimientoStockComponent implements OnInit {
  @ViewChild("buscadorInput", { static: true }) buscadorInput: ElementRef;
  @ViewChild("buscadorUsuarioInput", { static: true })
  buscadorUsuarioInput: ElementRef;

  dataSource = new MatTableDataSource<MovimientoStock>(null);
  expandedMovimiento: MovimientoStock;
  displayedColumns = [
    "id",
    "sucursal",
    "cantidad",
    "tipo",
    "estado",
    "fecha",
    "acciones",
  ];
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  horaInicioControl = new FormControl("00:00");
  horaFinalControl = new FormControl("23:59");
  buscarProductoControl = new FormControl();
  tipoMovimientoControl = new FormControl();
  buscarUsuarioControl = new FormControl();
  sucursalControl = new FormControl();
  referenciaControl = new FormControl();
  tipoMovimientoList: TipoMovimiento[] = Object.keys(TipoMovimiento).map(
    (key) => TipoMovimiento[key]
  );
  tableHeight;
  selectedProducto: Producto;
  productoList: Producto[] = [];
  selectedUsuario: Usuario;
  fechaFormGroup: FormGroup;
  today = new Date();
  sucursalList: Sucursal[];
  sucursalIdList: number[];
  productoIdList: number[];
  isDialogOpen = false;
  isPesable = false;
  page = 0;
  size = 20;
  selectedPageInfo: PageInfo<MovimientoStock>;
  
  stockActualDesglose: { sucursal: string; stock: number | null }[] = [];
  stockActualEstado: EstadoResumen = 'inicial';
  stockPeriodoEstado: EstadoResumen = 'inicial';
  /** Sucursales cuyo stock del período no se pudo leer (texto listo para el template). */
  stockPeriodoSinRespuesta = '';
  /** Descartan respuestas de un filtro anterior. Separados: paginar recarga la lista pero no el resumen. */
  private cargaLista = 0;
  private cargaResumen = 0;
  // Habilita el desglose por sucursal en el resumen. Depende de cuántas sucursales
  // se filtraron, no de cuántas devolvieron datos: un tipo de movimiento que solo
  // existe en una sucursal igual tiene que mostrar de cuál se trata.
  desgloseHabilitado = false;
  stockTotal: number | null = null;
  stockPorRangoFecha: number | null = null;
  stockPorTipoMovimiento: StockResumenView[];
  totalRecibidoGs = 0;
  totalRecibido = 0;
  totalRecibidoRs = 0;
  totalDescuento = 0;
  totalRecibidoDs = 0;
  totalAumento = 0;
  totalFinal = 0;

  loading = false;

  constructor(
    private service: MovimientoStockService,
    private matDialog: MatDialog,
    private windowInfoService: WindowInfoService,
    private sucursalService: SucursalService,
    private productoService: ProductoService,
    private dialog: MatDialog,
    private usuarioSearch: UsuarioSearchGQL,
    private usuarioService: UsuarioService,
    private notificacionService: NotificacionSnackbarService,
    private tabService: TabService,
    private ventaService: VentaService,
    private transferenciaService: TransferenciaService,
    private inventarioService: InventarioService
  ) {
    this.tableHeight = windowInfoService.innerHeight * 0.6;
  }

  ngOnInit(): void {
    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 7);

    this.fechaInicioControl.setValue(aux);
    this.fechaFinalControl.setValue(hoy);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl,
      inicioHora: this.horaInicioControl,
      finHora: this.horaFinalControl,
    });

    this.sucursalList = [];
    this.sucursalIdList = [];

    setTimeout(() => {
      this.sucursalService
        .onGetAllSucursales(true)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.sucursalList = res.filter((s) => {
            if (s.id != 0) {
              this.sucursalIdList.push(s.id);
              return s;
            }
          });
        });
    });
  }

  onGetResumen(isPagination: boolean = false) {

    let selectedSucursales = this.sucursalControl.value;

    if (!selectedSucursales || selectedSucursales.length === 0  || selectedSucursales.includes(null)) {
      selectedSucursales = this.sucursalList.filter(s => s.id !== 0);
    }

    const sucursalIdList = this.toEntityId(
      selectedSucursales,
      this.sucursalList
    );

    if (this.tipoMovimientoControl.value?.find((i) => i == "Todas") != null) {
      this.tipoMovimientoControl.setValue(null);
    }
    let fechaInicial: Date = this.fechaInicioControl.value;
    let fechaFin: Date = this.fechaFinalControl.value;
    let horaInicial: Date = stringToTime(this.horaInicioControl.value);
    let horaFinal: Date = stringToTime(this.horaFinalControl.value);
    fechaInicial.setHours(horaInicial.getHours());
    fechaInicial.setMinutes(horaInicial.getMinutes());
    fechaInicial.setSeconds(horaInicial.getSeconds());
    fechaFin.setHours(horaFinal.getHours());
    fechaFin.setMinutes(horaFinal.getMinutes());
    fechaFin.setSeconds(horaFinal.getSeconds());

    this.onGetMovimientos();

    if (sucursalIdList.length > 0 && !isPagination) {
      const carga = ++this.cargaResumen;
      this.stockTotal = null;
      this.stockPorRangoFecha = null;
      this.stockPorTipoMovimiento = [];
      this.stockActualDesglose = [];
      this.stockPeriodoSinRespuesta = '';
      this.desgloseHabilitado = sucursalIdList.length > 1;

      if (!this.selectedProducto?.id) {
        // Sin producto no se consulta nada: el central respondería null y parecería un fallo
        this.stockActualEstado = 'sin-producto';
        this.stockPeriodoEstado = 'sin-producto';
        this.notificacionService.openWarn(
          "Debe seleccionar un producto para realizar la búsqueda"
        );
        return;
      }
      const productoId = this.selectedProducto.id;
      const nombreDe = (index: number) =>
        this.sucursalList.find(s => s.id === sucursalIdList[index])?.nombre ?? 'Desconocido';

      // Stock actual: una consulta por sucursal; la que falla se marca, no corta a las demás
      this.stockActualEstado = 'cargando';
      const stockObservables = sucursalIdList.map(id =>
        this.service.onGetStockPorProducto(productoId, id, true, LECTURA_STOCK_RESUMEN, CONSULTA_RESUMEN, true).pipe(
          map((stock): any => stock == null ? SIN_RESPUESTA : stock),
          catchError(() => of<any>(SIN_RESPUESTA))
        )
      );
      forkJoin(stockObservables).pipe(untilDestroyed(this)).subscribe((res: any[]) => {
        if (carga !== this.cargaResumen) return; // respuesta de un filtro anterior
        this.stockActualDesglose = res.map((stock, index) => ({
          sucursal: nombreDe(index),
          stock: stock === SIN_RESPUESTA ? null : stock,
        }));
        if (res.some(stock => stock === SIN_RESPUESTA)) {
          // Un total con sucursales faltantes sería parcial: no se muestra
          this.stockTotal = null;
          this.stockActualEstado = 'no-disponible';
          this.avisarResumenIncompleto(carga);
          return;
        }
        this.stockTotal = res.reduce((total, stock) => total + stock, 0);
        this.stockActualEstado = 'ok';
      });

      // Stock del período por tipo de movimiento
      this.stockPeriodoEstado = 'cargando';
      const observables = sucursalIdList.map(id =>
        this.service
          .onGetStockPorTipoMovimiento(
            dateToString(fechaInicial),
            dateToString(fechaFin),
            [id],
            productoId,
            this.tipoMovimientoControl.value,
            this.selectedUsuario?.id
          )
          .pipe(
            // Con producto y fechas el central devuelve [] si no hay movimientos: un null es un fallo
            map((filas): any => Array.isArray(filas) ? filas : SIN_RESPUESTA),
            catchError(() => of<any>(SIN_RESPUESTA))
          )
      );

      forkJoin(observables).pipe(untilDestroyed(this)).subscribe((responses: any[]) => {
        if (carga !== this.cargaResumen) return;
        const sinRespuesta = responses
          .map((resPorSucursal, index) => resPorSucursal === SIN_RESPUESTA ? nombreDe(index) : null)
          .filter(nombre => nombre != null);
        if (sinRespuesta.length > 0) {
          this.stockPeriodoSinRespuesta = sinRespuesta.join(', ');
          this.stockPorTipoMovimiento = [];
          this.stockPorRangoFecha = null;
          this.stockPeriodoEstado = 'no-disponible';
          this.avisarResumenIncompleto(carga);
          return;
        }

        const agrupado: Map<string, StockResumenView> = new Map();
        let total = 0;

        responses.forEach((resPorSucursal: any[], index) => {
          const nombreSucursal = nombreDe(index);
          resPorSucursal.forEach((item) => {
            const key = item.tipoMovimiento;
            total += item.stock;

            if (!agrupado.has(key)) {
              agrupado.set(key, {
                tipoMovimiento: key,
                stock: 0,
                expanded: []
              });
            }

            const entry = agrupado.get(key);
            entry.stock += item.stock;
            entry.expanded.push({
              sucursal: nombreSucursal,
              stock: item.stock
            });
          });
        });

        this.stockPorRangoFecha = total;
        this.stockPorTipoMovimiento = Array.from(agrupado.values());
        this.stockPeriodoEstado = 'ok';
      });
    }
  }

  /** Un solo aviso por filtro aunque fallen los dos bloques del resumen (cada bloque muestra su propio cartel). */
  private cargaConAvisoDeResumen = -1;
  private avisarResumenIncompleto(carga: number): void {
    if (this.cargaConAvisoDeResumen === carga) return;
    this.cargaConAvisoDeResumen = carga;
    this.notificacionService.openWarn('No se pudo calcular el resumen de stock en todas las sucursales: volvé a filtrar.', 6);
  }

  onGetMovimientos() {
    this.sucursalIdList = this.toEntityId(
      this.sucursalControl.value,
      this.sucursalList
    );
    if (this.tipoMovimientoControl.value?.find((i) => i == "Todas") != null) {
      this.tipoMovimientoControl.setValue(null);
    }
    let fechaInicial: Date = this.fechaInicioControl.value;
    let fechaFin: Date = this.fechaFinalControl.value;
    let horaInicial: Date = stringToTime(this.horaInicioControl.value);
    let horaFinal: Date = stringToTime(this.horaFinalControl.value);
    fechaInicial.setHours(horaInicial.getHours());
    fechaInicial.setMinutes(horaInicial.getMinutes());
    fechaInicial.setSeconds(horaInicial.getSeconds());
    fechaFin.setHours(horaFinal.getHours());
    fechaFin.setMinutes(horaFinal.getMinutes());
    fechaFin.setSeconds(horaFinal.getSeconds());

    const carga = ++this.cargaLista;
    this.service
      .onGetMovimientoStockPorFiltros(
        dateToString(fechaInicial),
        dateToString(fechaFin),
        this.sucursalIdList,
        this.selectedProducto?.id,
        this.tipoMovimientoControl.value,
        this.selectedUsuario?.id,
        this.page,
        this.size
      )
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        if (carga !== this.cargaLista) return;
        // Ni filas ni paginador del filtro anterior
        this.selectedPageInfo = null;
        this.dataSource.data = [];
        this.notificacionService.openWarn('No se pudieron cargar los movimientos: volvé a filtrar.', 6);
      }, next: (res) => {
        if (carga !== this.cargaLista) return; // respuesta de un filtro o una página anterior
        if (!res) {
          this.selectedPageInfo = null;
          this.dataSource.data = [];
          return;
        }
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent || [];
        this.procesarDataDeAjustes();
      } });
  }
  onReferenciaClick(movimiento: MovimientoStock) {
    console.log(movimiento);
    switch (movimiento.tipoMovimiento) {
      case TipoMovimiento.VENTA:
        this.irAVenta(movimiento);
        break;
      case TipoMovimiento.AJUSTE:
        this.irAInventario(movimiento);
        break;
      case TipoMovimiento.TRANSFERENCIA:
        this.irATransferencia(movimiento);
        break;

      default:
        break;
    }
  }

  irAVenta(movimiento: MovimientoStock) {

    if (movimiento.referencia) {
      if (movimiento.data && movimiento.data.venta && movimiento.data.venta.caja) {
        const venta = movimiento.data.venta;
        this.abrirTabVenta(venta);
        return;
      }

      this.ventaService
        .onGetPorId(movimiento.referencia, movimiento.sucursalId, true, true, LECTURA_VENTA, CONSULTA_DETALLE)
        .subscribe((venta) => {

          if (venta) {
            if (venta.caja) {
              this.abrirTabVenta(venta);
            } else {
              this.notificacionService.openWarn(
                "La venta no tiene una caja asociada"
              );
            }
          } else {
            this.notificacionService.openWarn(
              "Despliegue el item para ir a la venta"
            );
          }
        },
          (error) => {
            this.notificacionService.openWarn(
              "Error al obtener la información de la venta: " + (error.message || error)
            );
          });
    } else {
      this.notificacionService.openWarn(
        "No se encontró la referencia de la venta"
      );
    }
  }

  abrirTabVenta(venta: any) {

    const caja = {
      ...venta.caja,
      sucursalId: venta.sucursalId
    };

    let tabData: TabData = new TabData();
    tabData.data = {
      caja: caja,
      ventaId: venta.id
    };
    
    this.tabService.addTab(
      new Tab(
        ListVentaComponent,
        `Ventas de caja ${caja.id}`,
        tabData,
        ListMovimientoStockComponent
      )
    );
  }

  irATransferencia(movimiento: MovimientoStock) {
    if (movimiento.referencia) {

      if (movimiento.data && movimiento.data.transferencia) {
        this.abrirTabTransferencia(movimiento.data.transferencia);
        return;
      }

      this.transferenciaService
        .onGetTransferenciaItem(movimiento.referencia)
        .subscribe((transferenciaItem) => {
          if (transferenciaItem && transferenciaItem.transferencia) {
            this.abrirTabTransferencia(transferenciaItem.transferencia);
          } else {
            this.notificacionService.openWarn(
              "No se pudo obtener la información de la transferencia"
            );
          }
        },
          (error) => {
            console.error('Error al obtener la transferencia:', error);
            this.notificacionService.openWarn(
              "Error al obtener la información de la transferencia: " + (error.message || error)
            );
          });
    } else {
      this.notificacionService.openWarn(
        "No se encontró la referencia de la transferencia"
      );
    }
  }

  abrirTabTransferencia(transferencia: any) {
    let tabData: TabData = new TabData();
    tabData.id = transferencia.id;

    this.tabService.addTab(
      new Tab(
        EditTransferenciaComponent,
        `Transferencia ${transferencia.id}`,
        tabData,
        ListMovimientoStockComponent
      )
    );
  }

  irAInventario(movimiento: MovimientoStock) {
    if (movimiento.referencia) {
      const esAjusteManual = Number(movimiento.referencia) === Number(movimiento.producto?.id);

      // Preparar datos comunes para el filtrado
      const datosComunes = {
        producto: movimiento.producto,
        usuario: movimiento.usuario,
        sucursalId: movimiento.sucursalId,
        fecha: movimiento.creadoEn,
        esAjusteManual: esAjusteManual
      };

      if (esAjusteManual) {
        let tabData: TabData = new TabData();
        tabData.data = {
          ...datosComunes,
          productoId: movimiento.producto?.id
        };

        this.tabService.addTab(
          new Tab(
            ListInventarioComponent,
            `Inventario Manual`,
            tabData,
            ListMovimientoStockComponent
          )
        );
      } else {
        let tabData: TabData = new TabData();
        tabData.data = {
          ...datosComunes,
          inventarioItemId: movimiento.referencia,
          productoId: movimiento.producto?.id
        };

        this.tabService.addTab(
          new Tab(
            ListInventarioComponent,
            `Inventario Item ${movimiento.referencia}`,
            tabData,
            ListMovimientoStockComponent
          )
        );
      }
    } else {
      this.notificacionService.openWarn(
        "No se encontró la referencia del ajuste"
      );
    }
  }

  resetFilters() { }

  onSelectProducto(producto) { }

  onBuscarProducto() {
    // let text: string = this.buscarProductoControl.value;
    // if (
    //   this.selectedProducto != null &&
    //   text.includes(this.selectedProducto.descripcion)
    // ) {
    //   this.onAddProducto();
    // } else {
    //   this.onSearchPorCodigo();
    // }
    this.onSearchPorCodigo();
  }

  onSearchPorCodigo() {
    let text = this.buscarProductoControl.value;
    this.isPesable = false;
    let peso;
    let codigo;
    if (text?.length == 13 && text.substring(0, 2) == "20") {
      this.isPesable = true;
      codigo = text.substring(2, 7);
      peso = +text.substring(7, 12) / 1000;
      text = codigo;
    }
    if (text != null) {
      this.productoService.onGetProductoPorCodigo(text).subscribe((res) => {
        if (res != null) {
          this.selectedProducto = res;
          this.buscarProductoControl.setValue(
            this.selectedProducto.id + " - " + this.selectedProducto.descripcion
          );
        } else {
          this.openSearchProducto(text);
        }
      });
    } else {
      this.openSearchProducto(text);
    }
  }

  openSearchProducto(texto?) {
    this.isDialogOpen = true;
    let data: PdvSearchProductoData = {
      texto: texto,
      cantidad: 1,
      mostrarOpciones: false,
      mostrarStock: true,
      conservarUltimaBusqueda: true,
    };
    this.dialog
      .open(PdvSearchProductoDialogComponent, {
        data: data,
        height: "80%",
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        let response: PdvSearchProductoResponseData = res;
        this.selectedProducto = response.producto;
        this.buscarProductoControl.setValue(
          this.selectedProducto.id + " - " + this.selectedProducto.descripcion
        );
      });
  }

  onAddProducto() {
    this.productoList.push(this.selectedProducto);
    this.buscarProductoControl.setValue(null);
    this.selectedProducto = null;
    this.buscadorInput.nativeElement.focus();
  }

  onClearProducto(producto: Producto, index) {
    this.productoList.splice(index, 1);
  }

  onFiltrar(isPagination: boolean = false) {
    this.dataSource.data = [];
    if (!isPagination) {
      this.stockPorRangoFecha = null;
      this.stockTotal = null;
      this.stockPorTipoMovimiento = [];
    }
    this.onGetResumen(isPagination);
  }

  resetFiltro() { }

  onGenerarPdf() { }

  onCancelarFiltro() { }

  onBuscarUsuario() {
    let data: SearchListtDialogData = {
      titulo: "Buscar usuario",
      query: this.usuarioSearch,
      tableData: [
        { id: "id", nombre: "Id", width: "10%" },
        { id: "nickname", nombre: "Nombre", width: "70%" },
      ],
      texto: this.buscarUsuarioControl.value,
      search: true,
      inicialSearch: true,
    };
    // data.
    this.dialog
      .open(SearchListDialogComponent, {
        data,
        height: "80%",
        width: "80%",
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res: Usuario) => {
        if (res != null) {
          this.usuarioService
            .onGetUsuario(res.id)
            .pipe(untilDestroyed(this))
            .subscribe((resUsuario) => {
              if (resUsuario != null) {
                this.selectedUsuario = resUsuario;
                this.buscarUsuarioControl.setValue(
                  res.id + " - " + res.nickname
                );
              } else {
                this.notificacionService.openWarn(
                  "No posee usuario registrado"
                );
                this.buscadorInput.nativeElement.select();
              }
            });
        }
      });
  }

  onClearUsuario() {
    this.selectedUsuario = null;
    this.buscarUsuarioControl.setValue(null);
    this.buscadorUsuarioInput.nativeElement.focus();
  }

  cambiarFecha(dias: string) {
    switch (dias) {
      case "dia":
        this.fechaInicioControl.setValue(getFirstDayOfCurrentWeek());
        this.fechaFinalControl.setValue(getLastDayOfCurrentWeek());
        break;
      case "mes":
        this.fechaInicioControl.setValue(getFirstDayOfMonths(-1));
        this.fechaFinalControl.setValue(getLastDayOfMonths(-1));
        break;
      case "2mes":
        this.fechaInicioControl.setValue(getFirstDayOfMonths(-2));
        this.fechaFinalControl.setValue(getLastDayOfMonths(-2));
        break;
      case "3mes":
        this.fechaInicioControl.setValue(getFirstDayOfMonths(-3));
        this.fechaFinalControl.setValue(getLastDayOfMonths(-3));
        break;
      default:
        break;
    }
  }

  toEntityId(entity: any[], sourceListId: any[]) {
    let idList = [];
    if (entity == null) entity = sourceListId;
    entity?.forEach((s) => idList.push(s?.id));
    return idList;
  }

  handlePageEvent(e: PageEvent) {
    this.page = e.pageIndex;
    this.size = e.pageSize;
    this.onFiltrar(true);
  }

  onClickRow(movimiento: MovimientoStock, index: number) {
    if (movimiento.data && typeof movimiento.data === 'string') {
      try {
        movimiento.data = JSON.parse(movimiento.data);
        this.dataSource.data = updateDataSource(
          this.dataSource.data,
          movimiento,
          index
        );
        return;
      } catch (e) {
        console.warn('Error al procesar data del backend:', e);
      }
    }

    // Un detalle marcado `noDisponible` (no se pudo leer el stock o la venta) se vuelve a pedir al desplegar
    if (movimiento.data == null || movimiento.data.noDisponible === true) {
      // El clic también colapsa la fila: el reintento de un detalle fallido solo corre al desplegarla, y de a uno
      if (movimiento.data != null && this.expandedMovimiento !== movimiento) return;
      if (this.detallesEnCarga.has(movimiento)) return;
      this.detallesEnCarga.add(movimiento);
      if (movimiento.tipoMovimiento !== TipoMovimiento.AJUSTE) {
        this.obtenerStockAnteriorYProcesarMovimiento(movimiento, index);
      } else {
        this.service.onGetStockAntesDeFecha(
          movimiento.producto.id,
          movimiento.sucursalId,
          this.formatearFechaParaBackend(movimiento.creadoEn)
        ).pipe(untilDestroyed(this)).subscribe({
          next: (stockPrevio) => {
            this.detallesEnCarga.delete(movimiento);
            if (stockPrevio == null) this.avisarStockAnteriorSinLeer(movimiento, index);
            this.procesarMovimientoConStock(movimiento, index, stockPrevio ?? null);
          },
          error: () => {
            this.detallesEnCarga.delete(movimiento);
            this.avisarStockAnteriorSinLeer(movimiento, index);
            this.procesarMovimientoConStock(movimiento, index, null);
          }
        });
      }
    }
  }

  /** Filas con el detalle pidiéndose (doble clic). */
  private detallesEnCarga = new WeakSet<MovimientoStock>();

  private avisarStockAnteriorSinLeer(movimiento: MovimientoStock, index: number): void {
    if (this.dataSource.data[index] !== movimiento) return; // la fila ya no está (refiltro o paginación)
    this.notificacionService.openWarn(
      'No se pudo leer el stock anterior de este movimiento: volvé a desplegarlo para reintentar.', 6);
  }

  /** Stock final de un movimiento. Con el stock anterior sin leer (`null`) NO es «la cantidad»: tampoco se sabe (#390). */
  private stockFinalDe(stockPrevio: number | null, movimiento: MovimientoStock): number | null {
    return stockPrevio == null ? null : stockPrevio + movimiento.cantidad;
  }

  /**
   * Escribe el detalle calculado de una fila. Las respuestas llegan tarde y por índice: si mientras tanto se
   * refiltró o se cambió de página, en ese índice hay otro movimiento y no se toca.
   */
  private escribirDetalle(movimiento: MovimientoStock, index: number, data: any): void {
    if (this.dataSource.data[index] !== movimiento) return;
    movimiento.data = data;
    this.dataSource.data = updateDataSource(this.dataSource.data, movimiento, index);
  }

  obtenerStockAnteriorYProcesarMovimiento(movimiento: MovimientoStock, index: number) {
    const fechaFormateada = this.formatearFechaParaBackend(movimiento.creadoEn);
    this.service.onGetStockAntesDeFecha(
      movimiento.producto.id,
      movimiento.sucursalId,
      fechaFormateada
    ).pipe(untilDestroyed(this)).subscribe({
      next: (stockPrevio) => {
        this.detallesEnCarga.delete(movimiento);
        if (stockPrevio == null) this.avisarStockAnteriorSinLeer(movimiento, index);
        this.procesarMovimientoConStockAnterior(movimiento, index, stockPrevio ?? null);
      },
      error: () => {
        this.detallesEnCarga.delete(movimiento);
        this.avisarStockAnteriorSinLeer(movimiento, index);
        this.procesarMovimientoConStockAnterior(movimiento, index, null);
      }
    });
  }

  procesarMovimientoConStockAnterior(movimiento: MovimientoStock, index: number, stockPrevio: number | null) {
    // Base de todo detalle: con `stockPrevio` null los dos valores quedan null («—» en pantalla) y `noDisponible`
    const stock = {
      stockAnterior: stockPrevio,
      stockFinal: this.stockFinalDe(stockPrevio, movimiento),
      noDisponible: stockPrevio == null,
    };
    switch (movimiento.tipoMovimiento) {
      case TipoMovimiento.VENTA: {
        // Sin la venta se muestra igual el detalle básico (stock), marcado para reintentar al desplegar
        const sinVenta = () => {
          // Si tampoco se leyó el stock ya se avisó: un aviso por despliegue
          if (stockPrevio != null && this.dataSource.data[index] === movimiento) {
            this.notificacionService.openWarn('No se pudo cargar la venta de este movimiento: volvé a desplegarlo para reintentar.', 6);
          }
          this.escribirDetalle(movimiento, index, { ...stock, noDisponible: true });
        };
        this.ventaService
          .onGetVentaItemPorId(movimiento.referencia, movimiento.sucursalId, true, LECTURA_VENTA, CONSULTA_DETALLE, true)
          .pipe(untilDestroyed(this))
          .subscribe({ error: sinVenta, next: (ventaItem) => {
            if (ventaItem?.venta?.id == null) {
              // No se encontró el ítem (o vino sin venta): data básica
              this.escribirDetalle(movimiento, index, stock);
              return;
            }
            this.ventaService
              .onGetPorId(ventaItem.venta.id, ventaItem.sucursalId, true, true, LECTURA_VENTA, CONSULTA_DETALLE)
              .pipe(untilDestroyed(this))
              .subscribe({ error: sinVenta, next: (venta) => {
                if (venta == null) {
                  sinVenta();
                  return;
                }
                this.escribirDetalle(movimiento, index, {
                  venta: venta,
                  totales: this.getTotales(venta),
                  ...stock,
                });
              } });
          } });
        break;
      }

      case TipoMovimiento.TRANSFERENCIA:
        this.transferenciaService
          .onGetTransferenciaItem(movimiento.referencia)
          .subscribe((res) => {
            this.escribirDetalle(movimiento, index, res != null ? { ...res, ...stock } : stock);
          },
          // onGetTransferenciaItem propaga el error de red (#390): detalle básico, marcado para reintentar
          () => {
            if (stockPrevio != null && this.dataSource.data[index] === movimiento) {
              this.notificacionService.openWarn("No se pudo cargar el detalle de la transferencia.", 5);
            }
            this.escribirDetalle(movimiento, index, { ...stock, noDisponible: true });
          });
        break;

      case TipoMovimiento.COMPRA:
      case TipoMovimiento.DEVOLUCION:
      case TipoMovimiento.DESCARTE:
      case TipoMovimiento.CALCULO:
      case TipoMovimiento.ENTRADA:
      case TipoMovimiento.SALIDA:
        this.escribirDetalle(movimiento, index, {
          tipo: movimiento.tipoMovimiento,
          referencia: movimiento.referencia,
          ...stock,
        });
        break;

      default:
        this.escribirDetalle(movimiento, index, stock);
        break;
    }
  }

  getTotales(venta: Venta) {
    this.totalRecibidoGs = 0;
    this.totalRecibidoRs = 0;
    this.totalRecibidoDs = 0;
    this.totalAumento = 0;
    this.totalDescuento = 0;
    this.totalFinal = 0;
    this.totalRecibido = 0;

    venta?.cobro?.cobroDetalleList.forEach((res) => {
      if (res.moneda.denominacion == "GUARANI") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoGs += res.valor;
          this.totalRecibido += res.valor;
          this.totalFinal += res.valor;
        } else if (res.aumento) {
          this.totalAumento += res.valor;
          this.totalFinal += res.valor;
        } else if (res.descuento) this.totalDescuento += res.valor;
      } else if (res.moneda.denominacion == "REAL") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoRs += res.valor;
          this.totalRecibido += res.valor * res.cambio;
          this.totalFinal += res.valor * res.cambio;
        }
      } else if (res.moneda.denominacion == "DOLAR") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoDs += res.valor;
          this.totalRecibido += res.valor * res.cambio;
          this.totalFinal += res.valor * res.cambio;
        }
      }
    });
    return {
      totalRecibidoGs: this.totalRecibidoGs,
      totalRecibidoRs: this.totalRecibidoRs,
      totalRecibidoDs: this.totalRecibidoDs,
      totalAumento: this.totalAumento,
      totalDescuento: this.totalDescuento,
      totalFinal: this.totalFinal,
      totalRecibido: this.totalRecibido,
    };
  }

  formatearFechaParaBackend(fecha: Date | string): string {
    if (!fecha) return '';
    let fechaDate: Date;
    if (typeof fecha === 'string') {
      fechaDate = new Date(fecha);
    } else {
      fechaDate = fecha;
    }
    const year = fechaDate.getFullYear();
    const month = String(fechaDate.getMonth() + 1).padStart(2, '0');
    const day = String(fechaDate.getDate()).padStart(2, '0');
    const hours = String(fechaDate.getHours()).padStart(2, '0');
    const minutes = String(fechaDate.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  // Método helper para verificar si es ajuste manual
  esAjusteManual(movimiento: MovimientoStock): boolean {
    return Number(movimiento.referencia) === Number(movimiento.producto?.id);
  }

  procesarDataDeAjustes() {
    console.log('Procesando data de ajustes para', this.dataSource.data?.length, 'movimientos');
    this.dataSource.data.forEach((movimiento, index) => {
      if (movimiento.tipoMovimiento === TipoMovimiento.AJUSTE) {
        console.log('Procesando ajuste:', movimiento.id, 'data actual:', movimiento.data);
        if (movimiento.data && typeof movimiento.data === 'string') {
          try {
            movimiento.data = JSON.parse(movimiento.data);
            console.log('Data parseada desde string:', movimiento.data);
          } catch (e) {
            console.warn('Error al procesar data del backend:', e);
          }
        }
        else if (!movimiento.data) {
          console.log('Calculando data para ajuste sin data:', movimiento.id);
          this.calcularDataParaAjuste(movimiento, index);
        } else {
          console.log('Ajuste ya tiene data:', movimiento.data);
        }
      }
    });
  }

  /** Carga de la lista en la que ya se avisó que faltan stocks anteriores (un aviso por carga, no uno por fila). */
  private cargaConAvisoDeAjustes = -1;

  calcularDataParaAjuste(movimiento: MovimientoStock, index: number) {
    const carga = this.cargaLista;
    const fechaFormateada = this.formatearFechaParaBackend(movimiento.creadoEn);
    // Se dispara por cada ajuste de la página (hasta 100): la consulta es silenciosa
    const sinStock = () => {
      if (carga !== this.cargaLista) return;
      // La fila queda marcada: muestra «—» y se reintenta al desplegarla
      this.escribirDetalle(movimiento, index, { cantidadPrevia: null, cantidadFinal: null, noDisponible: true });
      if (this.cargaConAvisoDeAjustes !== carga) {
        this.cargaConAvisoDeAjustes = carga;
        this.notificacionService.openWarn(
          'No se pudo leer el stock anterior de algunos ajustes: desplegá la fila para reintentar.', 6);
      }
    };
    this.service.onGetStockAntesDeFecha(
      movimiento.producto.id,
      movimiento.sucursalId,
      fechaFormateada
    ).pipe(untilDestroyed(this)).subscribe({
      next: (stockPrevio) => {
        if (carga !== this.cargaLista) return;
        if (stockPrevio == null) {
          sinStock();
          return;
        }
        this.procesarMovimientoConStock(movimiento, index, stockPrevio);
      },
      error: sinStock
    });
  }

  procesarMovimientoConStock(movimiento: MovimientoStock, index: number, stockPrevio: number | null) {
    // Convertir ambos a números para comparar correctamente
    const esAjusteManual = Number(movimiento.referencia) === Number(movimiento.producto?.id);
    const cantidades = {
      cantidadPrevia: stockPrevio,
      cantidadFinal: this.stockFinalDe(stockPrevio, movimiento),
      noDisponible: stockPrevio == null,
    };

    if (esAjusteManual) {
      this.escribirDetalle(movimiento, index, {
        tipo: 'AJUSTE_MANUAL',
        producto: movimiento.producto,
        observacion: 'Ajuste manual de stock realizado desde la gestión de productos',
        ...cantidades,
      });
    } else {
      this.inventarioService.onGetInventarioProductoItem(movimiento.referencia)
        .subscribe((res) => {
          // Sin el inventario se arma igual la data básica
          this.escribirDetalle(movimiento, index, { ...(res ?? {}), tipo: 'AJUSTE_INVENTARIO', ...cantidades });
        });
    }
  }
}
