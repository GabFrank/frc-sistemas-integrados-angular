import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Tab } from '../../../layouts/tab/tab.model';
import { TabService } from '../../../layouts/tab/tab.service';
import { ProductoComponent } from '../../productos/producto/edit-producto/producto.component';
import { Producto } from '../../productos/producto/producto.model';
import { EntradaDialogComponent } from '../entrada/entrada-dialog/entrada-dialog.component';
import { Entrada } from '../entrada/entrada.model';
import { EntradaService } from '../entrada/entrada.service';
import { Salida } from '../salida/salida.model';

@Component({
  selector: 'app-entrada-salida',
  templateUrl: './entrada-salida.component.html',
  styleUrls: ['./entrada-salida.component.scss'],
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
  entradaInicioControl = new FormControl()
  entradaFinControl = new FormControl()
  expandedSalida: Entrada;
  expandedEntrada: Entrada;


  entradaDisplayedColumns = ['id', 'responsableCarga', 'tipo', 'fecha', 'usuario', 'acciones']
  salidaDisplayedColumns = ['id', 'responsableCarga', 'tipo', 'fecha', 'usuario', 'acciones']

  constructor(
    private entradaService: EntradaService,
    private tabService: TabService,
    private matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    let inicio = new Date('2021-10-29 00:00:00')
    let fin = new Date('2021-10-30 00:00:00')
    this.entradaInicioControl.setValue(inicio)
    this.entradaFinControl.setValue(fin)
    this.entradaService.onGetEntradasPorFecha(
      this.entradaInicioControl.value,
      this.entradaFinControl.value
    ).subscribe(res => {
      this.entradaDataSource.data = res['data']
      console.log(this.entradaDataSource.data)
    })
    this.onAddEntrada()
  }

  onEntradaRowClick(row: Entrada){
    console.log(row)
    this.expandedEntrada = row;
  }

  onProductoLink(producto: Producto){
    this.tabService.addTab(new Tab(ProductoComponent, producto.descripcion, {data: producto}, EntradaSalidaComponent) )
  }

  onAddEntrada(){
    this.matDialog.open(EntradaDialogComponent, {
      height: '90%',
      width: '80%',
      disableClose: true
    })
  }

  onEditEntrada(entrada: Entrada){
    this.matDialog.open(EntradaDialogComponent, {
      data: {
        entrada
      }
    })
  }

}
