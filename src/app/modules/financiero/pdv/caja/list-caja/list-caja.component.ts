import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { FormControl, FormControlName, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { updateDataSource } from "../../../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../../layouts/tab/tab.service";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { SearchListDialogComponent, SearchListtDialogData } from "../../../../../shared/components/search-list-dialog/search-list-dialog.component";
import { ListVentaComponent } from "../../../../operaciones/venta/list-venta/list-venta.component";
import { VentaService } from "../../../../operaciones/venta/venta.service";
import { Funcionario } from "../../../../personas/funcionarios/funcionario.model";
import { PdvSearchProductoDialogComponent } from "../../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../../productos/producto/producto.model";
import { maletinPorDescripcionQuery } from "../../../maletin/graphql/graphql-query";
import { MaletinPorDescripcionGQL } from "../../../maletin/graphql/maletinPorDescripcion";
import { SearchMaletinGQL } from "../../../maletin/graphql/searchMaletin";
import { Maletin } from "../../../maletin/maletin.model";
import { AdicionarCajaDialogComponent } from "../adicionar-caja-dialog/adicionar-caja-dialog.component";
import { PdvCaja, PdvCajaEstado } from "../caja.model";
import { CajaService } from "../caja.service";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MostrarBalanceDialogComponent } from "../mostrar-balance-dialog/mostrar-balance-dialog.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-caja",
  templateUrl: "./list-caja.component.html",
  styleUrls: ["./list-caja.component.scss"],
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
export class ListCajaComponent implements OnInit {
  dataSource = new MatTableDataSource<PdvCaja>([]);
  selectedPdvCaja: PdvCaja;
  expandedCaja: PdvCaja;
  selectedProducto: Producto;
  selectedMaletin: Maletin;
  selectedCajero: Funcionario;
  lastValue = null;
  estadoList = [
    "En proceso",
    "Concluido",
    "Necesita verificacion",
    "En verificacion",
    "Verificado y concluido sin problema",
    "Verificado y concluido con problema",
  ];

  displayedColumns = [
    "id",
    "maletin",
    "activo",
    "estado",
    "fechaApertura",
    "fechaCierre",
    // 'observacion',
    "usuario",
    "acciones",
  ];

  fechaFormGroup: FormGroup;
  codigoControl = new FormControl(null, Validators.required);
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  estadoControl = new FormControl();
  maletinControl = new FormControl();
  responsableControl = new FormControl();
  codigoProductoControl = new FormControl();
  productoControl = new FormControl();
  activoControl = new FormControl();
  codigoMaletinControl = new FormControl()

  codigoCajeroControl = new FormControl();
  cajeroControl = new FormControl();
  today = new Date();

  constructor(
    private cajaService: CajaService,
    private matDialog: MatDialog,
    private cargandoDialog: CargandoDialogService,
    private tabService: TabService,
    private ventaService: VentaService,
    private searchMaletin: SearchMaletinGQL
  ) { }

  ngOnInit(): void {
    let hoy = new Date()
    let aux = new Date()
    aux.setDate(hoy.getDate() - 2)

    this.fechaInicioControl.setValue(aux)
    this.fechaFinalControl.setValue(hoy)

    this.onFilter()


    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl,
    });



    this.onBuscar()
  }

  onAdd(caja?: PdvCaja, index?) {
    this.matDialog.open(AdicionarCajaDialogComponent, {
      data: {
        caja,
      },
      width: "90%",
      height: "80%",
      disableClose: true,
      autoFocus: true,
      restoreFocus: true,
    });
  }

  onFilter() {
    if (this.codigoControl.valid) {
      this.fechaInicioControl.setValue(null)
      this.fechaFinalControl.setValue(null)
      this.cajaService.onGetById(this.codigoControl.value).pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.dataSource.data = []
          this.dataSource.data = updateDataSource(this.dataSource.data, res);
        }
      })
    } else {
      this.cajaService.onGetByDate(this.fechaInicioControl.value, this.fechaFinalControl.value).pipe(untilDestroyed(this)).subscribe((res) => {
        if (res != null) {
          this.dataSource.data = res;
        }
      });
    }

  }

  onResetFilter() { }

  irVentas(caja: PdvCaja) {
    let data = new TabData();
    data.data = caja;
    this.tabService.addTab(
      new Tab(
        ListVentaComponent,
        "Ventas de caja " + caja.id,
        data,
        ListCajaComponent
      )
    );
  }

  onCondigoEnter() { }

  onProductoSearch() {
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: {
          texto: this.productoControl.value,
        },
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.onSelectProducto(res?.producto);
        }
      });
  }

  onCajeroSearch() { }

  onSelectProducto(producto: Producto) {
    this.selectedProducto = producto;
    this.productoControl.setValue(producto.descripcion);
    this.codigoProductoControl.setValue(producto.id);
  }

  onChange() {
    if (this.activoControl.value == true && this.lastValue == false) {
      this.activoControl.setValue(null);
    }
    this.lastValue = this.activoControl.value;
  }

  onProductoEnter() { }

  onCajeroEnter() { }

  onBuscar() {
    this.ventaService
      .onGetVentasPorPeriodo("2022-03-01T00:00:00", "2022-03-03T00:00:00").pipe(untilDestroyed(this))
      .subscribe((res) => {
      });
  }

  onMaletinSearch() {
    let data: SearchListtDialogData = {
      titulo: 'Buscar caja',
      tableData: [{ id: 'id', nombre: 'Id', width: '5%' }, { id: 'descripcion', nombre: 'Descripción', width: '50%' }, { id: 'abierto', nombre: 'Abierto', width: '22%' }],
      query: this.searchMaletin,
      inicialSearch: true
    }
    this.matDialog.open(SearchListDialogComponent, {
      data: data,
      height: '80vh',
      width: '70vw'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) {
        this.onSelectMaletin(res);
      }
    })
  }

  onSelectMaletin(maletin: Maletin) {
    this.codigoMaletinControl.setValue(maletin.id)
    this.maletinControl.setValue(maletin.descripcion)
    this.selectedMaletin = maletin;
  }

  cargarMasDatos() {

  }

  getBalance() {
    this.cajaService.onGetBalanceByDate(this.fechaInicioControl.value, this.fechaFinalControl.value)
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.matDialog.open(MostrarBalanceDialogComponent, {
            data: {
              balance: res
            },
            width: '50%'
          })
        }
      })
  }
}

// true => false => null
// null => true => false
