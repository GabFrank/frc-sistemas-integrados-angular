import { Component, OnInit, ViewChild } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { PageInfo } from "../../../../app.component";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { Tab } from "../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { MainService } from "../../../../main.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { ProveedorService } from "../../../personas/proveedor/proveedor.service";
import { Devolucion, DevolucionEstado } from "../devolucion.model";
import { DevolucionService } from "../devolucion.service";
import { EditDevolucionComponent } from "../edit-devolucion/edit-devolucion.component";

@UntilDestroy()
@Component({
  selector: "app-list-devolucion",
  templateUrl: "./list-devolucion.component.html",
  styleUrls: ["./list-devolucion.component.scss"],
})
export class ListDevolucionComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource = new MatTableDataSource<Devolucion>([]);

  sucursalControl = new FormControl();
  estadoControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinControl = new FormControl();
  fechaFormGroup: FormGroup;

  selectedProveedor: Proveedor;
  proveedorTexto = "";

  sucursalList: Sucursal[] = [];
  estadoList = Object.values(DevolucionEstado);
  today = new Date();

  displayedColumns = [
    "id",
    "tipo",
    "proveedor",
    "sucursal",
    "estado",
    "resolucion",
    "fecha",
    "acciones",
  ];

  pageSize = 25;
  pageIndex = 0;
  selectedPageInfo: PageInfo<Devolucion>;

  constructor(
    private devolucionService: DevolucionService,
    private tabService: TabService,
    public mainService: MainService,
    private sucursalService: SucursalService,
    private proveedorService: ProveedorService
  ) {}

  ngOnInit(): void {
    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl,
    });

    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);

    this.sucursalService.onGetAllSucursales(true).subscribe((res) => {
      this.sucursalList = res.filter((s) => s.id != 0);
    });

    setTimeout(() => {
      if (this.paginator != null) {
        this.paginator._changePageSize(this.pageSize);
      }
      this.onFilter();
    }, 0);
  }

  onBuscarProveedor() {
    this.proveedorService
      .onSearchProveedorPorTexto(this.proveedorTexto)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.selectedProveedor = res;
          this.proveedorTexto = res.persona?.nombre;
          this.onFilter();
        }
      });
  }

  onRemoverProveedor() {
    this.selectedProveedor = null;
    this.proveedorTexto = "";
    this.onFilter();
  }

  onFilter() {
    let fechaInicio: Date = this.fechaInicioControl.value;
    let fechaFin: Date = this.fechaFinControl.value;
    let inicioStr: string = null;
    let finStr: string = null;
    if (fechaInicio != null) {
      let aux = new Date(fechaInicio);
      aux.setHours(0, 0, 0);
      inicioStr = dateToString(aux);
    }
    if (fechaFin != null) {
      let aux = new Date(fechaFin);
      aux.setHours(23, 59, 59);
      finStr = dateToString(aux);
    }
    this.devolucionService
      .onGetDevolucionesConFiltros(
        this.selectedProveedor?.id,
        this.sucursalControl.value?.id,
        this.estadoControl.value,
        inicioStr,
        finStr,
        this.pageIndex,
        this.pageSize
      )
      .pipe(untilDestroyed(this))
      .subscribe((res: PageInfo<Devolucion>) => {
        if (res != null) {
          this.selectedPageInfo = res;
          this.dataSource.data = res.getContent;
        }
      });
  }

  onResetFiltro() {
    this.sucursalControl.setValue(null);
    this.estadoControl.setValue(null);
    this.selectedProveedor = null;
    this.proveedorTexto = "";
    let unaSemanaAtras = new Date();
    unaSemanaAtras.setDate(this.today.getDate() - 7);
    this.fechaInicioControl.setValue(unaSemanaAtras);
    this.fechaFinControl.setValue(this.today);
    this.pageIndex = 0;
    this.onFilter();
  }

  onAdd() {
    this.tabService.addTab(
      new Tab(
        EditDevolucionComponent,
        "Nueva Devolución",
        null,
        ListDevolucionComponent
      )
    );
  }

  onEdit(devolucion: Devolucion) {
    this.tabService.addTab(
      new Tab(
        EditDevolucionComponent,
        "Devol. " + devolucion.id,
        new TabData(devolucion.id),
        ListDevolucionComponent
      )
    );
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onFilter();
  }
}
