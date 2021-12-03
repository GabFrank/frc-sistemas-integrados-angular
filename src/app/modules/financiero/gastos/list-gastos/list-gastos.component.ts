import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { GastoService } from '../gasto.service';
import { Gasto } from '../gastos.model';

@Component({
  selector: 'app-list-gastos',
  templateUrl: './list-gastos.component.html',
  styleUrls: ['./list-gastos.component.scss'],
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
export class ListGastosComponent implements OnInit {

  dataSource = new MatTableDataSource<Gasto>(null);
  selectedGasto: Gasto;
  expandedGasto: Gasto;

  displayedColumns = ['id', 'responsable', 'tigoGasto', 'descripcion', 'valorGs', 'valorRs', 'valorDs', 'acciones']

  constructor(
    private gastoService: GastoService
  ) { }

  ngOnInit(): void {
    this.gastoService.onGetByDate(null, null).subscribe(res => {
      if(res!=null){
        this.dataSource.data = res;
      }
    })
  }

  onAdd(gasto?: Gasto, index?, isClasificacion?:boolean){
    console.log('on add')
  }

  onFilter(){

  }

  onResetFilter(){

  }

}
