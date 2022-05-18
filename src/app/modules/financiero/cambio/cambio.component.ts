import { CrearCambioDialogComponent } from './crear-cambio-dialog/crear-cambio-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MonedaService } from './../moneda/moneda.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Cambio } from './cambio.model';
import { CambioService } from './cambio.service';
import { Moneda } from '../moneda/moneda.model';

@UntilDestroy()
@Component({
  selector: 'app-cambio',
  templateUrl: './cambio.component.html',
  styleUrls: ['./cambio.component.scss']
})
export class CambioComponent implements OnInit {
  
  dataSourceActual = new MatTableDataSource<Moneda>([])
  dataSourceHistorico = new MatTableDataSource<Cambio>([])

  displayedColumnsActual = [
    'id',
    'moneda',
    'cambioEnGs',
    'accion'
  ]

  constructor(private cambioService: CambioService, private monedaService: MonedaService, private matDialog: MatDialog) { }

  ngOnInit(): void {
    this.onGetMonedas()
  }

  onEditCambio(cambio: Moneda, i){
    this.matDialog.open(CrearCambioDialogComponent, {
      data: {
        moneda: cambio
      }
    }).afterClosed().subscribe(res => {
      if(res['cambio']!=null){
        this.onGetMonedas()
      }
    })
  }

  onGetMonedas(){
    this.monedaService.onGetAll()
    .pipe(untilDestroyed(this))
    .subscribe(res => {
      if(res!=null){
        this.dataSourceActual.data = res.filter(m => m.denominacion != 'GUARANI');
      }
    })
  }
}
