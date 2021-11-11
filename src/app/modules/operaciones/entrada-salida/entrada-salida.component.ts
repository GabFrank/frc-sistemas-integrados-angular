import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { Component, OnInit } from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { dialog } from "electron";
import { updateDataSource } from "../../../commons/core/utils/numbersUtils";
import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import { WindowInfoService } from "../../../shared/services/window-info.service";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { SucursalService } from "../../empresarial/sucursal/sucursal.service";
import { ProductoComponent } from "../../productos/producto/edit-producto/producto.component";
import { PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from "../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component";
import { Producto } from "../../productos/producto/producto.model";
import { EntradaDialogComponent } from "../entrada/entrada-dialog/entrada-dialog.component";
import { Entrada } from "../entrada/entrada.model";
import { EntradaService } from "../entrada/entrada.service";
import { SalidaDialogComponent } from "../salida/salida-dialog/salida-dialog.component";
import { Salida } from "../salida/salida.model";
import { SalidaService } from "../salida/salida.service";

@Component({
  selector: "app-entrada-salida",
  templateUrl: "./entrada-salida.component.html",
  styleUrls: ["./entrada-salida.component.scss"],
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
export class EntradaSalidaComponent implements OnInit {
  entradaDataSource = new MatTableDataSource<Entrada>(null);
  salidaDataSource = new MatTableDataSource<Salida>(null);
  productoIdControl = new FormControl();
  productoDescripcionControl = new FormControl();
  estadoControl = new FormControl()
  sucursalControl = new FormControl()
  entradaInicioControl = new FormControl();
  entradaFinControl = new FormControl();
  salidaInicioControl = new FormControl();
  salidaFinControl = new FormControl();
  expandedSalida: Salida;
  expandedEntrada: Entrada;
  sucursalList: Sucursal[];
  selectedProducto: Producto;
  selectedSucursal: Sucursal;
  tableHeight;

  entradaDisplayedColumns = [
    "id",
    "responsableCarga",
    "tipo",
    "fecha",
    "estado",
    "acciones",
  ];
  salidaDisplayedColumns = [
    "id",
    "responsableCarga",
    "tipo",
    "fecha",
    "estado",
    "acciones",
  ];

  constructor(
    private entradaService: EntradaService,
    private salidaService: SalidaService,
    private tabService: TabService,
    private matDialog: MatDialog,
    private dialogoService: DialogosService,
    private sucursalService: SucursalService,
    private windowInfoService: WindowInfoService
  ) {
    this.tableHeight = windowInfoService.innerHeight * 0.6;
  }

  ngOnInit(): void {

    this.sucursalList = []


    this.resetFilters();
    this.onGetEntradas();
    this.onGetSalidas();
    this.buscarSucursales();
    this.createForm();
    // this.entradaService.onGetEntrada(3).subscribe(res => {
    //   this.onAddEntrada(res)
    // })
  }

  createForm(){
    this.productoIdControl.disable()
  }

  buscarSucursales() {
    this.sucursalService.onGetAllSucursales().subscribe((res) => {
      this.sucursalList = res.sort((a, b) => {
        if (a.nombre < b.nombre) {
          return -1;
        } else {
          return 1;
        }
      });
    });
  }

  onGetEntradas() {
    if (
      this.entradaInicioControl.value == null ||
      this.entradaInicioControl.value > new Date()
    ) {
      console.log('reseteando por entrada null o mayor a actual')
      this.resetFilters();
    }
    if (
      this.entradaFinControl.value == null ||
      this.entradaFinControl.value > new Date()
    )
      this.entradaFinControl.setValue(new Date());
    this.entradaService
      .onGetEntradasPorFecha(
        this.entradaInicioControl.value,
        this.entradaFinControl.value
      )
      .subscribe((res) => {
        this.entradaDataSource.data = res["data"];
        this.aplicarFiltrosEntrada(this.entradaDataSource.data)
        console.log(this.entradaDataSource.data);
      });
  }

  onGetSalidas() {
    if (
      this.entradaInicioControl.value == null ||
      this.entradaInicioControl.value > new Date()
    ) {
      this.resetFilters();
    }
    if (
      this.entradaFinControl.value == null ||
      this.entradaFinControl.value > new Date()
    )
      this.entradaFinControl.setValue(new Date());
    this.salidaService
      .onGetSalidasPorFecha(
        this.entradaInicioControl.value,
        this.entradaFinControl.value
      )
      .subscribe((res) => {
        this.salidaDataSource.data = res["data"];
        this.aplicarFiltrosSalida(this.salidaDataSource.data)
        console.log(this.salidaDataSource.data);
      });
  }

  onEntradaRowClick(row: Entrada) {
    console.log(row);
    this.expandedEntrada = row;
  }

  onSalidaRowClick(row: Salida) {
    console.log(row);
    this.expandedSalida = row;
  }

  onProductoLink(producto: Producto) {
    this.tabService.addTab(
      new Tab(
        ProductoComponent,
        producto.descripcion,
        { data: producto },
        EntradaSalidaComponent
      )
    );
  }

  onAddEntrada(entrada) {
    this.matDialog.open(EntradaDialogComponent, {
      data: { entrada },
      height: "90%",
      width: "80%",
      disableClose: true,
    }).afterClosed().subscribe(res => {
      if(res!=null){
        let aux = this.entradaDataSource.data;
        aux.push(res)
        this.entradaDataSource.data = aux;
      }
    });
  }

  onEditEntrada(entrada: Entrada, index?) {
    console.log(entrada);
    this.matDialog.open(EntradaDialogComponent, {
      data: {
        entrada,
      },
      height: "90%",
      width: "80%",
      disableClose: true,
    }).afterClosed().subscribe(res => {
      if(res!=null){
        let aux = this.entradaDataSource.data;
        aux[index] = res;
        this.entradaDataSource.data = aux;
      }
    });;
  }

  onFiltrar() {
    this.onGetEntradas();
    this.onGetSalidas()
  }

  onCancelarFiltro() {
    this.resetFilters();
  }

  resetFilters() {
    let hoy: Date = new Date();
    let ayer: Date = new Date();
    ayer.setDate(ayer.getDate() - 1);
    ayer.setHours(0);
    ayer.setMinutes(0);
    ayer.setSeconds(0);
  
    console.log(hoy, ayer);
    this.entradaInicioControl.setValue(ayer);
    this.entradaFinControl.setValue(hoy);
    this.estadoControl.setValue(null);
    this.sucursalControl.setValue(null);
    this.productoIdControl.setValue(null);
    this.productoDescripcionControl.setValue(null);
  }

  onAddSalida(salida: Salida) {
    let auxArray: Salida[] = [];
    this.matDialog
      .open(SalidaDialogComponent, {
        data: { salida },
        height: "90%",
        width: "80%",
        disableClose: true,
      })
      .afterClosed()
      .subscribe((res) => {
        console.log(res);
        if (res != null) {
          this.salidaDataSource.data = updateDataSource(this.salidaDataSource.data, res)  
        }
      });
  }
  onEditSalida(salida: Salida) {
    let auxArray: Salida[] = [];
    this.matDialog.open(SalidaDialogComponent, {
      data: {
        salida,
      },
      height: "90%",
      width: "80%",
      disableClose: true,
    }).afterClosed().subscribe(res => {
      if(res!=null){
        let index = this.salidaDataSource.data.findIndex(s => s.id == res.id)
        if(index > -1){
          this.salidaDataSource.data = updateDataSource(this.salidaDataSource.data, res, index)  
        }
      }
    })
  }

  deleteEntrada(entrada:Entrada, i){
    console.log(i)
    this.dialogoService.confirm('Atención!!', 'Realmente desea eliminar esta entrada?').subscribe(response => {
      if(response){
        this.entradaService.onDeleteEntrada(entrada.id).subscribe(res => {
          if(res){
            let aux = this.entradaDataSource.data;
            aux.splice(i, 1);
            this.entradaDataSource.data = aux;          
          }
        })
      }
    })
  }

  deleteSalida(salida:Salida, i){
    console.log(i)
    this.dialogoService.confirm('Atención!!', 'Realmente desea eliminar esta salida?').subscribe(response => {
      if(response){
        this.salidaService.onDeleteSalida(salida.id).subscribe(res => {
          if(res){
            let aux = this.salidaDataSource.data;
            aux.splice(i, 1);
            this.salidaDataSource.data = aux;
          }
        })
      }
    })
  }

  onImprimirEntrada(id){
    this.entradaService.onImprimirEntrada(id).subscribe(res => {
      console.log(res)
    });
  }

  onSelectSucursal(e){

  }

  searchProducto() {
    let texto: string = this.productoDescripcionControl.value;
    this.matDialog
      .open(PdvSearchProductoDialogComponent, {
        data: {
          texto: texto != null ? texto.toUpperCase() : "",
          mostrarStock: true
        },
        width: "100%",
        height: "100%",
      })
      .afterClosed()
      .subscribe((res) => {
        let respuesta: PdvSearchProductoResponseData;
        if (res != null) {
          respuesta = res;
          this.onSelectProducto(respuesta.producto);
        }
      });
  }

  onSelectProducto(producto){
    this.selectedProducto = producto;
    this.productoIdControl.setValue(this.selectedProducto.id)
    this.productoDescripcionControl.setValue(this.selectedProducto.descripcion)
  }

  aplicarFiltrosEntrada(entradaList: Entrada[]){
    if(this.productoIdControl.value!=null){
      entradaList = entradaList.filter(e => {
        return (e.entradaItemList.find(ei => ei.producto.id == this.productoIdControl.value) != null)
      })
    }
    if(this.estadoControl.value!=null){
      entradaList = entradaList.filter(e => e.activo == this.estadoControl.value)
    }
    if(this.sucursalControl.value!=null){
      console.log(this.sucursalControl.value)
      entradaList = entradaList.filter(e => e.sucursal != null && e.sucursal?.id == this.sucursalControl.value)
    }
    this.entradaDataSource.data = entradaList;
  }

  aplicarFiltrosSalida(salidaList: Salida[]){
    if(this.productoIdControl.value!=null){
      salidaList = salidaList.filter(e => {
        return (e.salidaItemList.find(ei => ei.producto.id == this.productoIdControl.value) != null)
      })
    }
    if(this.estadoControl.value!=null){
      salidaList = salidaList.filter(e => e.activo == this.estadoControl.value)
    }
    if(this.sucursalControl.value!=null){
      console.log(this.sucursalControl.value)
      console.log(salidaList)
      salidaList = salidaList.filter(e => e.sucursal != null && e.sucursal?.id == this.sucursalControl.value)
    }
    this.salidaDataSource.data = salidaList;
  }

  onEstadoChange(e){
    if(this.estadoControl.value == null){
      this.estadoControl.setValue(true)
    } else if(this.estadoControl.value == true){
      this.estadoControl.setValue(false)
    } else {
      this.estadoControl.setValue(null)
    }
  }
}

// none => true => false => none
