import { trigger, state, style, transition, animate } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MovimientoStock } from '../movimiento-stock.model';
import { MovimientoStockService } from '../movimiento-stock.service';

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
  displayedColumns = ['id', 'producto', 'cantidad', 'tipo', 'estado', 'usuario']

  constructor(
    private service: MovimientoStockService
  ) { }

  ngOnInit(): void {

    let fin = new Date()
    let inicio = new Date(fin.getDate() - 1)
    inicio.setHours(0);
    inicio.setMinutes(0);
    inicio.setSeconds(0)
    this.service.onGetMovimientosPorFecha(inicio, fin).subscribe(res => {
      if(res['data'].length > 0){
        this.movimientosDataSource.data = res['data'];
      }
    })

  }

}
