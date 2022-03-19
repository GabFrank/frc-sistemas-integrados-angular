import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { WindowInfoService } from '../../../../shared/services/window-info.service';
import { PdvSearchProductoDialogComponent, PdvSearchProductoResponseData } from '../../../productos/producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { Producto } from '../../../productos/producto/producto.model';
import { MovimientoStock } from '../movimiento-stock.model';
import { MovimientoStockService } from '../movimiento-stock.service';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-list-movimiento-stock',
  templateUrl: './list-movimiento-stock.component.html',
  styleUrls: ['./list-movimiento-stock.component.scss'],
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
export class ListMovimientoStockComponent implements OnInit {

  movimientosDataSource = new MatTableDataSource<MovimientoStock>(null);
  expandedMovimiento: MovimientoStock;
  displayedColumns = ['id', 'producto', 'cantidad', 'tipo', 'estado', 'fecha', 'acciones']
  inicioControl = new FormControl()
  finControl = new FormControl()
  productoIdControl = new FormControl()
  productoDescripcionControl = new FormControl()
  tableHeight;
  selectedProducto: Producto;

  constructor(
    private service: MovimientoStockService,
    private matDialog : MatDialog,
    private windowInfoService: WindowInfoService
  ) {
    this.tableHeight = windowInfoService.innerHeight * 0.6;
   }

  ngOnInit(): void {

    this.resetFilters();
    this.onGetMovimientos();
    this.productoIdControl.disable()
  }

  onGetMovimientos(){
    if (
      this.inicioControl.value == null ||
      this.inicioControl.value > new Date()
    ) {
      this.resetFilters();
    }
    if (
      this.finControl.value == null ||
      this.finControl.value > new Date()
    )
      this.finControl.setValue(new Date());
    this.service
      .onGetMovimientosPorFecha(
        this.inicioControl.value,
        this.finControl.value
      ).pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.movimientosDataSource.data = res["data"];
        this.aplicarFiltros(this.movimientosDataSource.data)
      });
  }
  onReferenciaClick(movimiento: MovimientoStock){
    console.log(movimiento)
    this.matDialog.open(this.service.getTipoMovimientoComponent(movimiento.tipoMovimiento), {
      data: {
        id: movimiento.referencia
      },
      width: '80%',
      height: '80%',
    })
  }

  resetFilters(){
    let hoy: Date = new Date();
    let ayer: Date = new Date();
    ayer.setDate(ayer.getDate() - 1);
    ayer.setHours(0);
    ayer.setMinutes(0);
    ayer.setSeconds(0);
  
    console.log(hoy, ayer);
    this.inicioControl.setValue(ayer);
    this.finControl.setValue(hoy);
    this.productoIdControl.setValue(null);
    this.productoDescripcionControl.setValue(null);
  }

  aplicarFiltros(movimientoList: MovimientoStock[]){
    if(this.productoIdControl.value!=null){
      movimientoList = movimientoList.filter(e => e.producto.id == this.productoIdControl.value)
    }
    this.movimientosDataSource.data = movimientoList;
  }
  
  onSelectProducto(producto){
    this.selectedProducto = producto;
    this.productoIdControl.setValue(this.selectedProducto.id)
    this.productoDescripcionControl.setValue(this.selectedProducto.descripcion)
  }

  searchProducto(){
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
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        let respuesta: PdvSearchProductoResponseData;
        if (res != null) {
          respuesta = res;
          this.onSelectProducto(respuesta.producto);
        }
      });
  }

  onFiltrar(){
    this.onGetMovimientos()
  }

  onCancelarFiltro(){

  }

}
