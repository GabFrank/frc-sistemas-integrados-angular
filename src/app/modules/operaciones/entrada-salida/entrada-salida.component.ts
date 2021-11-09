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
import { ProductoComponent } from "../../productos/producto/edit-producto/producto.component";
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
  entradaInicioControl = new FormControl();
  entradaFinControl = new FormControl();
  salidaInicioControl = new FormControl();
  salidaFinControl = new FormControl();
  expandedSalida: Salida;
  expandedEntrada: Entrada;

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
    private dialogoService: DialogosService
  ) {}

  ngOnInit(): void {
    this.resetFilters();
    this.onGetEntradas();
    this.onGetSalidas();
    // this.entradaService.onGetEntrada(3).subscribe(res => {
    //   this.onAddEntrada(res)
    // })
  }

  onGetEntradas() {
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
    this.entradaService
      .onGetEntradasPorFecha(
        this.entradaInicioControl.value,
        this.entradaFinControl.value
      )
      .subscribe((res) => {
        this.entradaDataSource.data = res["data"];
        console.log(this.entradaDataSource.data);
      });
  }

  onGetSalidas() {
    if (
      this.salidaInicioControl.value == null ||
      this.salidaInicioControl.value > new Date()
    ) {
      this.resetFilters();
    }
    if (
      this.salidaFinControl.value == null ||
      this.salidaFinControl.value > new Date()
    )
      this.salidaFinControl.setValue(new Date());
    this.salidaService
      .onGetSalidasPorFecha(
        this.entradaInicioControl.value,
        this.entradaFinControl.value
      )
      .subscribe((res) => {
        this.salidaDataSource.data = res["data"];
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
  }

  onCancelarFiltro() {
    this.resetFilters();
  }

  resetFilters() {
    let hoy: Date = new Date();
    let ayer: Date = new Date();
    ayer.setDate(ayer.getDate() - 1);
    console.log(hoy, ayer);
    this.entradaInicioControl.setValue(ayer);
    this.entradaFinControl.setValue(hoy);
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
}
