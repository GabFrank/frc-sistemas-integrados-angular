import { Venta } from "../venta.model";
import { VentaService } from "../venta.service";
import { MatSort } from "@angular/material/sort";
import { PageInfo } from "../../../../app.component";
import { MatDialog } from "@angular/material/dialog";
import { FormControl, FormGroup } from "@angular/forms";
import { Tab } from "../../../../layouts/tab/tab.model";
import { VentaEstado } from "../enums/venta-estado.enums";
import { MatTableDataSource } from "@angular/material/table";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { PdvCaja } from "../../../financiero/pdv/caja/caja.model";
import { Cliente } from "../../../personas/clientes/cliente.model";
import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { CajaService } from "../../../financiero/pdv/caja/caja.service";
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { VentaObservacion } from "../../venta-observacion/venta-observacion.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { VentaObservacionService } from "../../venta-observacion/venta-observacion.service";
import { ClientesSearchConFiltrosGQL } from "../../../personas/clientes/graphql/clienteWithFilters";
import { VentaObservacionDashboardComponent } from "../../venta-observacion/venta-observacion-dashboard/venta-observacion-dashboard.component";
import { SearchListDialogComponent, SearchListtDialogData, TableData } from "../../../../shared/components/search-list-dialog/search-list-dialog.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-generic-list-venta',
  templateUrl: './generic-list-venta.component.html',
  styleUrls: ['./generic-list-venta.component.scss'],
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
export class GenericListVentaComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Input()
  data: Tab;

  today = new Date();
  selectedCliente: Cliente;
  selectedCaja: PdvCaja;
  ventaDataSource = new MatTableDataSource<Venta>([]);
  ventaDisplayedColumns = [
    "id",
    "cliente",
    "sucursal",
    "fecha",
    "formaPago",
    "estado",
    "total",
    "modo",
    "acciones"
  ];

  form: FormGroup;
  modoControl = new FormControl();
  estadoControl = new FormControl();
  conObsControl = new FormControl();
  monedaControl = new FormControl();
  idVentaControl = new FormControl();
  clienteControl = new FormControl();
  fechaFinControl = new FormControl();
  sucursalControl = new FormControl();
  formaPagoControl = new FormControl();
  conAumentoControl = new FormControl();
  fechaInicioControl = new FormControl();
  conDescuentoControl = new FormControl();

  expandedVenta: Venta;
  sucursalIdList: number[];
  monedaList: Moneda[] = [];
  sucursalList: Sucursal[] = [];
  formaPagoList: FormaPago[] = [];
  ventaObservacionList: VentaObservacion[];
  ventaEstadoList = Object.keys(VentaEstado)

  // Pagination
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  totalFinal = 0;
  totalAumento = 0;
  totalRecibido = 0;
  isLoading = false;
  isLastPage = false;
  totalDescuento = 0;
  totalRecibidoRs = 0;
  totalRecibidoDs = 0;
  totalRecibidoGs = 0;
  selectedPageInfo: PageInfo<Venta>;

  constructor(
    private matDialog: MatDialog,
    private cajaService: CajaService,
    private ventaService: VentaService,
    private monedaService: MonedaService,
    private dialogoService: DialogosService,
    private sucursalService: SucursalService,
    private formaPagoService: FormaPagoService,
    private clienteSearch: ClientesSearchConFiltrosGQL,
    private ventaObservacionService: VentaObservacionService,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    
    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 7);
    
    this.form = new FormGroup({
      modo: this.modoControl,
      id: this.idVentaControl,
      estado: this.estadoControl,
      moneda: this.monedaControl,
      cliente: this.clienteControl,
      fechaFin: this.fechaFinControl,
      sucursal: this.sucursalControl,
      formaPago: this.formaPagoControl,
      conObservacion: this.conObsControl,
      conAumento: this.conAumentoControl,
      fechaInicio: this.fechaInicioControl,
      conDescuento: this.conDescuentoControl
    });

    this.formaPagoService.onGetAllFormaPago().subscribe((res) => {
      this.formaPagoList = res;
    });
    
    this.monedaService.onGetAll().subscribe((res) => {
      this.monedaList = res;
    });

    this.sucursalList = [];
    this.sucursalIdList = [];

    this.sucursalService.onGetAllSucursalesByActive(true, true)
      .subscribe((res) => {
        this.sucursalList = res.filter((s) => {
          if (s.id != 0 && s.id != 999) {
            this.sucursalIdList.push(s.id);
            return s;
          }
      });
    })

    this.ventaObservacionService.ventaObservacionBS
      .pipe(untilDestroyed(this))
      .subscribe((observaciones: VentaObservacion[]) => {
        this.ventaObservacionList = observaciones;
        this.onObservado(this.ventaDataSource.data);
        this.ventaDataSource.data = [...this.ventaDataSource.data];
      })
  }


  onFiltrarConReset() {
    this.pageIndex = 0;
    this.paginator.firstPage();
    this.onFiltrar();
  }

  onFiltrar() {
    this.isLoading = true;
    let fechaInicio = this.fechaInicioControl.value != null ? 
      this.fechaInicioControl.value?.toISOString().slice(0, 10) : null;
    let fechaFin = this.fechaFinControl.value != null ? 
      this.fechaFinControl.value?.toISOString().slice(0, 10) : null;

    this.ventaService
      .onVentasFilter(
        this.idVentaControl.value,
        null, // cajaId
        this.pageIndex,
        this.pageSize,
        false, // asc (descending by default)
        this.sucursalControl.value,
        this.formaPagoControl.value,
        this.estadoControl.value,
        this.modoControl.value,
        this.monedaControl.value?.id,
        this.conDescuentoControl.value,
        this.conAumentoControl.value,
        this.conObsControl.value,
        this.selectedCliente?.id,
        fechaInicio,
        fechaFin
      )
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.isLoading = false;
        if (res != null) {
          this.selectedPageInfo = res;
          this.ventaDataSource.data = res.getContent;
          this.onObservado(this.ventaDataSource.data);
          this.ventaDataSource.data = [...this.ventaDataSource.data];
        }
      });
  }
  
  onClickRow(venta: Venta, index) {
    if (venta.ventaItemList == null) {
      this.isLoading = true;
      this.ventaService
        .onGetPorId(venta.id, venta?.sucursalId, true)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.isLoading = false;
          if (res != null) {
            let selectedVenta = this.ventaDataSource.data[index];
            selectedVenta.cobro = res.cobro;
            selectedVenta.isDelivery = res.isDelivery;
            selectedVenta.delivery = res.delivery;
            selectedVenta.ventaItemList = res.ventaItemList;
            this.ventaDataSource.data = updateDataSource(
              this.ventaDataSource.data,
              venta,
              index
            );
            this.getTotales(venta);
          }
        });
    } else {
      this.getTotales(venta);
    }
    // this.loadObservaciones();
  }
  
  onResetFiltro() {
    this.selectedCliente = null;
    this.selectedPageInfo = null;
    this.ventaDataSource.data = [];
    this.modoControl.setValue(null);
    this.estadoControl.setValue(null);
    this.monedaControl.setValue(null);
    this.idVentaControl.setValue(null);
    this.clienteControl.setValue(null);
    this.conObsControl.setValue(false);
    this.sucursalControl.setValue(null);
    this.fechaFinControl.setValue(null);
    this.formaPagoControl.setValue(null);
    this.conAumentoControl.setValue(false);
    this.fechaInicioControl.setValue(null);
    this.conDescuentoControl.setValue(false);
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
        } else if (res.aumento) {
          this.totalAumento += res.valor * res.cambio;
          this.totalFinal += res.valor * res.cambio;
        } else if (res.descuento) {
          this.totalDescuento += res.valor * res.cambio;
        }
      } else if (res.moneda.denominacion == "DOLAR") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoDs += res.valor;
          this.totalRecibido += res.valor * res.cambio;
          this.totalFinal += res.valor * res.cambio;
        } else if (res.aumento) {
          this.totalAumento += res.valor * res.cambio;
          this.totalFinal += res.valor * res.cambio;
        } else if (res.descuento) {
          this.totalDescuento += res.valor * res.cambio;
        }
      }
    });
  }

  onGetBalance() {
    this.isLoading = true;
    this.cajaService
      .onCajaBalancePorIdAndSucursalId(
        this.selectedCaja.id,
        this.selectedCaja?.sucursal?.id
      )
      .subscribe((res) => {
        this.isLoading = false;
        if (res != null) this.selectedCaja.balance = res;
      });
  }

  onClearCliente() {
    this.clienteControl.setValue(null);
    this.selectedCliente = null;
  }

  onSearchCliente() {
    let tableData: TableData[] = [
      {
        id: "id",
        nombre: "Id",
        width: "10%"
      },
      {
        id: "nombre",
        nombre: "Persona",
        nested: true,
        nestedId: "persona",
        nestedColumnId: "persona"
      },
      {
        id: "nombre",
        nombre: "Nombre",
      },
    ];
    let data: SearchListtDialogData = {
      titulo: 'Buscar Cliente',
      query: this.clienteSearch,
      tableData: tableData,
      search: true,
      queryData: { texto: this.clienteControl.value},
      inicialSearch: false,
      paginator: true,
    };

    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        width: '30%',
        height: '50%',
        
      })
      .afterClosed()
      .subscribe((res: Cliente | any) => {
        if (res != null) {
          this.selectedCliente = res;
          this.clienteControl.setValue(res.persona.nombre);
        }
      });
  }

  onToggleConObs(selected: boolean) {
    this.conObsControl.setValue(selected);
  }

  onToggleConDescuento(selected: boolean) {
    this.conDescuentoControl.setValue(selected);
  }

  onToggleConAumento(selected: boolean) {
    this.conAumentoControl.setValue(selected);
  }

  handlePageEvent(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.onFiltrar();
  }

  onObservado(ventas: Venta[]): Venta[] {
    ventas.forEach((venta) => {
      venta['hasObservation'] = venta.ventaObservacionList && venta.ventaObservacionList.length > 0;
    });

    if (this.conObsControl.value) {
      ventas = ventas.filter((sale) => sale['hasObservation']);
    }

    return ventas;
  }
  
  onListObservaciones(venta: Venta) {
    const dialogRef = this.matDialog
      .open(VentaObservacionDashboardComponent, {
        width: "1950px",
        height: "550px",
        data: { venta: venta }
      })
    dialogRef.afterClosed()
      .subscribe(() => {
        this.ventaObservacionService.onGetVentasObservaciones().subscribe();
      })
  }

  onCancelarVenta(venta: Venta, index: number) {
    this.dialogoService
      .confirm("Atención!!", "Realmente desea cancelar esta venta?")
      .subscribe((res) => {
        if (res) {
          this.ventaService
            .onCancelarVenta(venta.id, venta.sucursalId)
            .subscribe((res1) => {
              if (res1) {
                this.notificacionService.openSucess(
                  "Venta cancelada con éxito"
                );
                if (venta.estado == VentaEstado.CANCELADA) {
                  venta.estado = VentaEstado.CONCLUIDA;
                } else {
                  venta.estado = VentaEstado.CANCELADA;
                }
                this.ventaDataSource.data = updateDataSource(
                  this.ventaDataSource.data,
                  venta,
                  index
                );
                this.onGetBalance();
              } else {
                this.notificacionService.openAlgoSalioMal(
                  "Ups! No se pudo cancelar la venta. "
                );
              }
            });
        }
      });
  }
}