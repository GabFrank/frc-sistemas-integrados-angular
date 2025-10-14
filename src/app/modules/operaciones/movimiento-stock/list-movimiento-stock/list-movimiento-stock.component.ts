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

  stockTotal = 0;
  stockPorRangoFecha = 0;
  stockPorTipoMovimiento: StockPorTipoMovimientoDto[];
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
        .onGetAllSucursales(true, true)
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
    const sucursalIdList = this.toEntityId(
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

    this.onGetMovimientos();

    // if sucursalid list is not empty, get stock for each sucursal and sum itm add logs  
    if (sucursalIdList.length > 0 && !isPagination) {
      if (this.selectedProducto?.id) {
        sucursalIdList.forEach((sucursalId) => {
          this.service
            .onGetStockPorProducto(this.selectedProducto.id, sucursalId)
            .subscribe((res) => {
              this.stockTotal += res;
            });
        });
      } else {
        // Notificar que se requiere seleccionar un producto para esta métrica específica
        this.notificacionService.openWarn(
          "Debe seleccionar un producto para realizar la búsqueda"
        );
      }

      this.service
        .onGetStockPorTipoMovimiento(
          dateToString(fechaInicial),
          dateToString(fechaFin),
          this.sucursalIdList,
          this.selectedProducto?.id,
          this.tipoMovimientoControl.value,
          this.selectedUsuario?.id
        )
        .subscribe((res: StockPorTipoMovimientoDto[]) => {
          console.log(res);
          if (Array.isArray(res)) {
            res.forEach((t) => {
              this.stockPorRangoFecha += t.stock;
            });
            this.stockPorTipoMovimiento = res;
          } else {
            this.stockPorTipoMovimiento = [];
          }
        });
    }
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
      .subscribe((res) => {
        if (!res) {
          this.selectedPageInfo = null;
          this.dataSource.data = [];
          return;
        }
        this.selectedPageInfo = res;
        this.dataSource.data = res.getContent || [];
        this.procesarDataDeAjustes();
      });
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
        .onGetPorId(movimiento.referencia, movimiento.sucursalId, true)
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
    tabData.data = caja;
    
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

  resetFilters() {}

  onSelectProducto(producto) {}

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
      this.stockPorRangoFecha = 0;
      this.stockTotal = 0;
      this.stockPorTipoMovimiento = [];
    }
    this.onGetResumen(isPagination);
  }

  resetFiltro() {}

  onGenerarPdf() {}

  onCancelarFiltro() {}

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
            .onGetUsuarioPorPersonaId(res.id)
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

    if (movimiento.data == null) {
      if (movimiento.tipoMovimiento !== TipoMovimiento.AJUSTE) {
        this.obtenerStockAnteriorYProcesarMovimiento(movimiento, index);
      } else {
        this.service.onGetStockAntesDeFecha(
          movimiento.producto.id,
          movimiento.sucursalId,
          this.formatearFechaParaBackend(movimiento.creadoEn)
        ).subscribe({
          next: (stockPrevio) => {
            console.log('Stock previo obtenido:', stockPrevio, 'para movimiento:', movimiento.id);
            this.procesarMovimientoConStock(movimiento, index, stockPrevio || 0);
          },
          error: (error) => {
            console.error('Error al obtener stock anterior:', error);
            this.procesarMovimientoConStock(movimiento, index, 0);
          }
        });
      }
    }
  }

  obtenerStockAnteriorYProcesarMovimiento(movimiento: MovimientoStock, index: number) {
    const fechaFormateada = this.formatearFechaParaBackend(movimiento.creadoEn);
    this.service.onGetStockAntesDeFecha(
      movimiento.producto.id,
      movimiento.sucursalId,
      fechaFormateada
    ).subscribe({
      next: (stockPrevio) => {
        this.procesarMovimientoConStockAnterior(movimiento, index, stockPrevio || 0);
      },
      error: (error) => {
        console.error('Error al obtener stock anterior para movimiento:', movimiento.tipoMovimiento, error);
        this.procesarMovimientoConStockAnterior(movimiento, index, 0);
      }
    });
  }

  procesarMovimientoConStockAnterior(movimiento: MovimientoStock, index: number, stockPrevio: number) {
    switch (movimiento.tipoMovimiento) {
      case TipoMovimiento.VENTA:
        this.ventaService
          .onGetVentaItemPorId(movimiento.referencia, movimiento.sucursalId)
          .subscribe((ventaItem) => {
            if (ventaItem != null) {
              this.ventaService
                .onGetPorId(ventaItem.venta.id, ventaItem.sucursalId)
                .subscribe((venta) => {
                  movimiento.data = {
                    venta: venta,
                    totales: this.getTotales(venta),
                    stockAnterior: stockPrevio,
                    stockFinal: stockPrevio + movimiento.cantidad
                  };
                  console.log('Data de venta con stock anterior:', movimiento.data);
                  this.dataSource.data = updateDataSource(
                    this.dataSource.data,
                    movimiento,
                    index
                  );
                });
            } else {
              // Si no se encuentra el venta item, crear data básica
              movimiento.data = {
                stockAnterior: stockPrevio,
                stockFinal: stockPrevio + movimiento.cantidad
              };
              this.dataSource.data = updateDataSource(
                this.dataSource.data,
                movimiento,
                index
              );
            }
          });
        break;

      case TipoMovimiento.TRANSFERENCIA:
        this.transferenciaService
          .onGetTransferenciaItem(movimiento.referencia)
          .subscribe((res) => {
            if (res != null) {
              movimiento.data = {
                ...res,
                stockAnterior: stockPrevio,
                stockFinal: stockPrevio + movimiento.cantidad
              };
              console.log('Data de transferencia con stock anterior:', movimiento.data);
              } else {
              movimiento.data = {
                stockAnterior: stockPrevio,
                stockFinal: stockPrevio + movimiento.cantidad
              };
            }
            this.dataSource.data = updateDataSource(
              this.dataSource.data,
              movimiento,
              index
            );
          });
        break;

      case TipoMovimiento.COMPRA:
      case TipoMovimiento.DEVOLUCION:
      case TipoMovimiento.DESCARTE:
      case TipoMovimiento.CALCULO:
      case TipoMovimiento.ENTRADA:
      case TipoMovimiento.SALIDA:
        movimiento.data = {
          tipo: movimiento.tipoMovimiento,
          referencia: movimiento.referencia,
          stockAnterior: stockPrevio,
          stockFinal: stockPrevio + movimiento.cantidad
        };
        console.log(`Data de ${movimiento.tipoMovimiento} con stock anterior:`, movimiento.data);
        this.dataSource.data = updateDataSource(
          this.dataSource.data,
          movimiento,
          index
        );
        break;

      default:
        movimiento.data = {
          stockAnterior: stockPrevio,
          stockFinal: stockPrevio + movimiento.cantidad
        };
        this.dataSource.data = updateDataSource(
          this.dataSource.data,
          movimiento,
          index
        );
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

  calcularDataParaAjuste(movimiento: MovimientoStock, index: number) {
    const fechaFormateada = this.formatearFechaParaBackend(movimiento.creadoEn);
    
    this.service.onGetStockAntesDeFecha(
      movimiento.producto.id,
      movimiento.sucursalId,
      fechaFormateada
    ).subscribe({
      next: (stockPrevio) => {
        if (stockPrevio !== undefined && stockPrevio !== null) {
          this.procesarMovimientoConStock(movimiento, index, stockPrevio);
        }
      },
      error: (error) => {
        console.error('Error al obtener stock antes de fecha:', error);
      }
    });
  }

  procesarMovimientoConStock(movimiento: MovimientoStock, index: number, stockPrevio: number) {
    // Convertir ambos a números para comparar correctamente
    const referenciaNum = Number(movimiento.referencia);
    const productoIdNum = Number(movimiento.producto?.id);
    const esAjusteManual = referenciaNum === productoIdNum;
    
    console.log('Procesando movimiento:', {
      id: movimiento.id,
      referencia: movimiento.referencia,
      productoId: movimiento.producto?.id,
      referenciaNum: referenciaNum,
      productoIdNum: productoIdNum,
      esAjusteManual: esAjusteManual,
      stockPrevio: stockPrevio,
      cantidad: movimiento.cantidad
    });

    if (esAjusteManual) {
      movimiento.data = {
        tipo: 'AJUSTE_MANUAL',
        producto: movimiento.producto,
        observacion: 'Ajuste manual de stock realizado desde la gestión de productos',
        cantidadPrevia: stockPrevio,
        cantidadFinal: stockPrevio + movimiento.cantidad
      };
      console.log('Data de ajuste manual creada:', movimiento.data);
      this.dataSource.data = updateDataSource(
        this.dataSource.data,
        movimiento,
        index
      );
    } else {
      this.inventarioService.onGetInventarioProductoItem(movimiento.referencia)
        .subscribe((res) => {
          if (res != null) {
            movimiento.data = {
              ...res,
              tipo: 'AJUSTE_INVENTARIO',
              cantidadPrevia: stockPrevio,
              cantidadFinal: stockPrevio + movimiento.cantidad
            };
            console.log('Data de ajuste por inventario creada:', movimiento.data);
            this.dataSource.data = updateDataSource(
              this.dataSource.data,
              movimiento,
              index
            );
          } else {
            console.warn('No se encontró inventario item para referencia:', movimiento.referencia);
            // Crear data básica aunque no se encuentre el inventario
            movimiento.data = {
              tipo: 'AJUSTE_INVENTARIO',
              cantidadPrevia: stockPrevio,
              cantidadFinal: stockPrevio + movimiento.cantidad
            };
            this.dataSource.data = updateDataSource(
              this.dataSource.data,
              movimiento,
              index
            );
          }
        });
    }
  }
}
