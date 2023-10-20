import { Component, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { FacturaLegal, FacturaLegalItem } from "../factura-legal.model";
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
    if (this.fechaFormGroup.valid && this.sucursalControl.valid) {
      let fechaInicio = dateToString(this.fechaInicioControl.value);
      let fechaFin = dateToString(this.fechaFinControl.value);
      this.facturaService
        .onGetAllFacturasLegales(
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
          this.dataSource.data = res;
          res?.length > 0 ? this.calcularResumen() : null;
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
      f.ruc = removeSecondDigito(f.ruc);
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
  }

  exportarExcel() {
    let filename = "frc_";
    let sucursalesNames: Sucursal[] = this.sucursalControl.value;

    sucursalesNames.forEach((s) => {
      filename += s.nombre.replace(/[. ]/g, "_");
    });

    let fechaInicio = dateToString(this.fechaInicioControl.value);
    let fechaFin = dateToString(this.fechaFinControl.value);
    this.facturaService.exportarExcel(
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
      this.iva10Control.value,
      (filename + new Date().toLocaleDateString()).trim().toLowerCase()
    );
  }

  onImprimir(factura: FacturaLegal, i) {
    this.facturaService.onReimprimirFactura(factura.id, factura.sucursalId);
  }
}
