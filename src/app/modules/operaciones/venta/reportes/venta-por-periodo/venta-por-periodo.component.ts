import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-venta-por-periodo',
  templateUrl: './venta-por-periodo.component.html',
  styleUrls: ['./venta-por-periodo.component.scss']
})
export class VentaPorPeriodoComponent implements OnInit {

  fechaInicialControl = new FormControl()
  fechaFinalControl = new FormControl()
  fechaFormGroup = new FormGroup({})  
  today = new Date()
  dataSource = new MatTableDataSource<any>([])
  expandedCaja;

  displayedColumns = ['fecha', 'ventaGs', 'ventaRs', 'ventaDs', 'ventaTotalGs']

  constructor() { }

  ngOnInit(): void {

    this.fechaFormGroup.addControl('inicio', this.fechaInicialControl)
    this.fechaFormGroup.addControl('fin', this.fechaFinalControl)
  }

  onFilter(){

  }

}
