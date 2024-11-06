import { Component, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import {
  FacturaLegal,
  FacturaLegalItem,
  ResumenFacturasDto,
} from "../factura-legal.model";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { FacturaLegalService } from "../factura-legal.service";
import { AddFacturaLegalDialogComponent } from "../add-factura-legal-dialog/add-factura-legal-dialog.component";
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { dateToString } from "../../../../commons/core/utils/dateUtils";
import { BdcWalkService, TaskList } from "bdc-walkthrough";
import { removeSecondDigito } from "../../../../commons/core/utils/rucUtils";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { PageInfo } from "../../../../app.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-factura-legal",
  templateUrl: "./list-factura-legal.component.html",
  styleUrls: ["./list-factura-legal.component.scss"],
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
export class ListFacturaLegalComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  selectedSucursal: Sucursal;
  sucursalList: Sucursal[];
  sucursalIdList: number[];
  sucursalControl = new FormControl([], Validators.required);
  nombreControl = new FormControl(null);
  rucControl = new FormControl(null);
  fechaInicioControl = new FormControl(null, Validators.required);
  fechaFinControl = new FormControl(null, Validators.required);
  iva5Control = new FormControl(true);
  iva10Control = new FormControl(true);
  fechaFormGroup: FormGroup;

  length = 25;
  pageSize = 25;
  pageIndex = 0;
  pageEvent: PageEvent;
  orderById = null;
  orderByNombre = null;
  selectedPageInfo: PageInfo<FacturaLegal>;

  today = new Date();
  cantidadFacturas = 0;
  numeroInicioFactura;
  numeroFinFactura;
  totalEnGs = 0;
  total0 = 0;
  total5 = 0;
  total10 = 0;
  expandedElement;

  allSucursales = false;

  selectedFacturaItem: FacturaLegalItem;
  facturaList: FacturaLegal[];
  page = 0;
  size = 30;
  isLast = true;
  dataSource = new MatTableDataSource<FacturaLegal>([]);
  facturaItemDataSource = new MatTableDataSource<FacturaLegalItem>([]);

  displayedColumns = [
    "id",
    "sucursal",
    "numero",
    "cliente",
    "ruc",
    "totalFinal",
    "creadoEn",
    "acciones",
  ];

  facturaItemColumnsToDisplay = [
    "id",
    "descripcion",
    "cantidad",
    "precioUnitario",
    "total",
  ];

  selectedResumenFacturas: ResumenFacturasDto;

  constructor(
    private sucursalService: SucursalService,
    private facturaService: FacturaLegalService,
    private cargandoService: CargandoDialogService,
    private matDialog: MatDialog,
    public bdcWalkService: BdcWalkService
  ) {}

  iniciarTutorial() {
    this.bdcWalkService.disableAll(false);
    this.bdcWalkService.reset("factura");
    this.bdcWalkService.setTaskCompleted("inicio", 1);
  }

  onFinalizar() {
    this.bdcWalkService.reset("factura");
    this.bdcWalkService.disableAll(true);
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.paginator._changePageSize(this.paginator.pageSizeOptions[1]);
      this.pageSize = this.paginator.pageSizeOptions[1];
      this.onFilter();
    }, 0);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinControl,
    });

    let date = new Date();
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    this.fechaInicioControl.setValue(firstDay);
    this.fechaFinControl.setValue(this.today);
    this.sucursalList = [];
    this.sucursalIdList = [];
    this.sucursalService
      .onGetAllSucursales()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.sucursalList = res.filter((s) => {
          if (s.id != 0) {
            this.sucursalIdList.push(s.id);
            return s;
          }
        });
      });
  }

  onFilter() {
    this.onGetFacturas();
    this.onGetResumen();
  }

  onGetResumen() {
    if (this.fechaFormGroup.valid && this.sucursalControl.valid) {
      let fechaInicio = dateToString(this.fechaInicioControl.value);
      let fechaFin = dateToString(this.fechaFinControl.value);
      this.facturaService
        .onGetResumenFacturas(
          fechaInicio,
          fechaFin,
          this.toSucursalesId(this.sucursalControl.value),
          this.rucControl.value != null
            ? `%${this.rucControl.value?.toUpperCase()}%`
            : null,
          this.nombreControl.value != null
            ? `%${this.nombreControl.value?.toUpperCase()}%`
            : null,
          this.iva5Control.value,
          this.iva10Control.value
        )
        .subscribe((res) => {
          if (res != null) {
            this.selectedResumenFacturas = res;
          }
        });
       console.log('hola');
        
    }
  }

  onGetFacturas() {
    if (this.fechaFormGroup.valid && this.sucursalControl.valid) {
      let fechaInicio = dateToString(this.fechaInicioControl.value);
      let fechaFin = dateToString(this.fechaFinControl.value);
      this.facturaService
        .onGetAllFacturasLegales(
          this.pageIndex,
          this.pageSize,
          fechaInicio,
          fechaFin,
          this.toSucursalesId(this.sucursalControl.value),
          this.rucControl.value != null
            ? `%${this.rucControl.value?.toUpperCase()}%`
            : null,
          this.nombreControl.value != null
            ? `%${this.nombreControl.value?.toUpperCase()}%`
            : null,
          this.iva5Control.value,
          this.iva10Control.value
        )
        .subscribe((res) => {
          this.selectedPageInfo = res;
          this.dataSource.data = this.selectedPageInfo?.getContent;
        });
    }
  }

  calcularResumen() {
    this.total0 = 0;
    this.total5 = 0;
    this.total10 = 0;
    this.cantidadFacturas = this.dataSource.data?.length;
    this.numeroInicioFactura = this.dataSource.data[0]?.numeroFactura;
    this.numeroFinFactura =
      this.dataSource.data[this.dataSource.data?.length - 1]?.numeroFactura;
    this.totalEnGs = 0;
    this.dataSource.data?.forEach((f) => {
      this.totalEnGs += f?.totalFinal;
      this.total0 += f.ivaParcial0;
      this.total5 += f.ivaParcial5;
      this.total10 += f.ivaParcial10;
      let ruc = removeSecondDigito(f.ruc);
      console.log(ruc);
      f.ruc = ruc;
    });
  }

  toSucursalesId(sucursales: Sucursal[]) {
    let idList = [];
    sucursales.forEach((s) => idList.push(s.id));
    return idList;
  }

  onAdd() {
    this.matDialog
      .open(AddFacturaLegalDialogComponent, {
        data: {
          sucursal: this.selectedSucursal,
        },
        width: "50%",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.dataSource.data = updateDataSource(this.dataSource.data, res);
        }
      });
  }

  onEdit(factura, i) {
    // this.matDialog.open(AdicionarFacturaDialogComponent, {
    //   data: {
    //     factura,
    //     sucursal: this.selectedSucursal
    //   },
    //   width: '50%'
    // }).afterClosed().subscribe(res => {
    //   if (res != null) {
    //     this.dataSource.data = updateDataSource(this.dataSource.data, res, i)
    //   }
    // })
  }

  onDeleteFactura(factura, i) {
    // this.facturaService.onDeleteFactura(factura.id)
    //   .pipe(untilDestroyed(this))
    //   .subscribe(res => {
    //     if (res) {
    //       this.dataSource.data = updateDataSource(this.dataSource.data, null, i)
    //     }
    //   })
  }

  onDeleteFacturaItem(facturaItem, i) {
    // this.facturaItemService.onDeleteFacturaItem(facturaItem.id)
    //   .pipe(untilDestroyed(this))
    //   .subscribe(res => {
    //     if (res) {
    //       this.facturaItemDataSource.data = updateDataSource(this.facturaItemDataSource.data, null, i)
    //     }
    //   })
  }

  onEditFacturaItem(facturaItem, i) {
    // console.log(i);
    // this.matDialog.open(AdicionarFacturaItemDialogComponent, {
    //   data: {
    //     factura: this.expandedElement,
    //     facturaItem
    //   }
    //   ,
    //   width: '50%'
    // }).afterClosed().subscribe(res => {
    //   if (res != null) {
    //     this.facturaItemDataSource.data = updateDataSource(this.facturaItemDataSource.data, res, i)
    //     // this.dataSource.data = updateDataSource(this.dataSource.data, this.facturaItemDataSource.data, i)
    //   }
    // })
  }

  onAddFacturaItem(factura: FacturaLegalItem, i) {
    // this.matDialog.open(AdicionarFacturaItemDialogComponent, {
    //   data: {
    //     factura
    //   }
    //   ,
    //   width: '50%'
    // }).afterClosed().subscribe(res => {
    //   if (res != null) {
    //     this.facturaItemDataSource.data = updateDataSource(this.facturaItemDataSource.data, res)
    //     // this.dataSource.data = updateDataSource(this.dataSource.data, this.facturaItemDataSource.data, i)
    //   }
    // })
  }

  resetFiltro() {
    let date = new Date();
    let firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    this.fechaInicioControl.setValue(firstDay);
    this.fechaFinControl.setValue(this.today);
    this.sucursalControl.setValue(null);
    this.nombreControl.setValue(null);
    this.rucControl.setValue(null);
    this.selectedResumenFacturas = null;
    this.dataSource.data = [];
  }

  exportarExcel(todos?: Boolean) {
    let filename = "frc_";
    let sucursalesNames: Sucursal[] = this.sucursalControl.value;

    if (sucursalesNames.length != 1 && todos == false) {
      return null;
    }
    let fechaFinDate: Date = this.fechaFinControl.value;
    fechaFinDate.setHours(23, 59, 59, 59);
    let fechaInicio = dateToString(this.fechaInicioControl.value);
    let fechaFin = dateToString(fechaFinDate);

    !todos
      ? this.facturaService
          .onGenerarExcelFacturas(fechaInicio, fechaFin, sucursalesNames[0].id)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res != null && res == "") return null;
            const byteCharacters = atob(res);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Create a Blob from the byte array
            const blob = new Blob([byteArray], {
              type: "application/vnd.ms-excel",
            });

            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            document.body.appendChild(a);
            a.setAttribute("style", "display: none");
            a.href = url;
            a.download = `${sucursalesNames[0]?.nombre
              .replace(" ", "_")
              .toLowerCase()}_${fechaInicio.substring(0, 10)}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          })
      : this.facturaService
          .onGenerarExcelFacturasZip(
            fechaInicio,
            fechaFin,
            this.toSucursalesId(this.sucursalControl.value)
          )
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res != null && res == "") return null;
            const byteCharacters = atob(res);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);

            // Create a Blob from the byte array
            const blob = new Blob([byteArray], {
              type: "application/zip",
            });

            let url = window.URL.createObjectURL(blob);
            let a = document.createElement("a");
            document.body.appendChild(a);
            a.setAttribute("style", "display: none");
            a.href = url;
            a.download = `facturas-bodega-franco-${fechaInicio.substring(
              0,
              10
            )}.zip`;
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
          });
  }

  onImprimir(factura: FacturaLegal, i) {
    this.facturaService.onReimprimirFactura(factura.id, factura.sucursalId);
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.onGetFacturas();
  }
}
