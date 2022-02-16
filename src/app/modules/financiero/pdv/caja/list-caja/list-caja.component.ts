import {
  animate,
  state,
  style,
  transition,
  trigger,
} from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Tab } from "../../../../../layouts/tab/tab.model";
import { TabData, TabService } from "../../../../../layouts/tab/tab.service";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { ListVentaComponent } from "../../../../operaciones/venta/list-venta/list-venta.component";
import { Funcionario } from "../../../../personas/funcionarios/funcionario.model";
import { PdvSearchProductoDialogComponent } from "../../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../../../productos/producto/producto.model";
import { AdicionarCajaDialogComponent } from "../adicionar-caja-dialog/adicionar-caja-dialog.component";
import { PdvCaja, PdvCajaEstado } from "../caja.model";
import { CajaService } from "../caja.service";

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
  dataSource = new MatTableDataSource<PdvCaja>(null);
  selectedPdvCaja: PdvCaja;
  expandedCaja: PdvCaja;
  selectedProducto: Producto;
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
  codigoControl = new FormControl();
  fechaInicioControl = new FormControl();
  fechaFinalControl = new FormControl();
  estadoControl = new FormControl();
  maletinControl = new FormControl();
  responsableControl = new FormControl();
  codigoProductoControl = new FormControl();
  productoControl = new FormControl();
  activoControl = new FormControl()

  codigoCajeroControl = new FormControl();
  cajeroControl = new FormControl();
  today = new Date()

  constructor(
    private cajaService: CajaService,
    private matDialog: MatDialog,
    private cargandoDialog: CargandoDialogService,
    private tabService: TabService
  ) {}

  ngOnInit(): void {
    this.cajaService.onGetByDate(null, null).subscribe((res) => {
      if (res != null) {
        this.dataSource.data = res;
        console.log(res);
        // if(this.dataSource.data.length > 0) this.irVentas(this.dataSource.data[this.dataSource.data.length-2])
      }
    });

    console.log(PdvCajaEstado["En proceso"]);

    this.fechaFormGroup = new FormGroup({
      inicio: this.fechaInicioControl,
      fin: this.fechaFinalControl
    })
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

  onFilter() {}

  onResetFilter() {}

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

  onCondigoEnter() {}

  onProductoSearch() {
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: {
          texto: this.productoControl.value,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.onSelectProducto(res?.producto);
        }
      });
  }

  onCajeroSearch() {}

  onSelectProducto(producto: Producto) {
    this.selectedProducto = producto;
    this.productoControl.setValue(producto.descripcion);
    this.codigoProductoControl.setValue(producto.id);
  }


  onChange(){
    if(this.activoControl.value == true && this.lastValue == false){
      this.activoControl.setValue(null)
    } 
    this.lastValue = this.activoControl.value;
    console.log(this.activoControl.value)
  }

  onProductoEnter(){
  
  }

  onCajeroEnter(){
    
  }
}




// true => false => null
// null => true => false