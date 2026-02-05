import { MatSort } from "@angular/material/sort";
import { FormControl, FormGroup } from "@angular/forms";
import { Tab } from "../../../../layouts/tab/tab.model";
import { VentaEstado } from "../enums/venta-estado.enums";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { SearchListDialogComponent, SearchListtDialogData, TableData } from "../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { ClientesSearchConFiltrosGQL } from "../../../personas/clientes/graphql/clienteWithFilters";
import { MatDialog } from "@angular/material/dialog";
import { Cliente } from "../../../personas/clientes/cliente.model";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatTableDataSource } from "@angular/material/table";
import { Venta } from "../venta.model";
import { VentaService } from "../venta.service";
import { PageInfo } from "../../../../app.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-generic-list-venta',
  templateUrl: './generic-list-venta.component.html',
  styleUrls: ['./generic-list-venta.component.scss']
})
export class GenericListVentaComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Input()
  data: Tab;

  today = new Date();
  selectedCliente: Cliente;
  ventaDataSource = new MatTableDataSource<Venta>([]);
  ventaDisplayedColumns = [
    "id",
    "cliente",
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

  sucursalIdList: number[];
  monedaList: Moneda[] = [];
  sucursalList: Sucursal[] = [];
  formaPagoList: FormaPago[] = [];
  ventaEstadoList = Object.keys(VentaEstado)

  // Pagination
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  isLastPage = false;
  isLoading = false;
  selectedPageInfo: PageInfo<Venta>;

  constructor(
    private formaPagoService: FormaPagoService,
    private monedaService: MonedaService,
    private sucursalService: SucursalService,
    private clienteSearch: ClientesSearchConFiltrosGQL,
    private matDialog: MatDialog,
    private ventaService: VentaService
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
  }

  onFiltar() {
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
        }
      });
  }

  onResetFiltro() {
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

  onClearCliente() {
    this.clienteControl.setValue(null);
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
    this.onFiltar();
  }
}