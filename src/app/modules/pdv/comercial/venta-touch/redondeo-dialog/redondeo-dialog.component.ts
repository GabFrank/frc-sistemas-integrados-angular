import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MonedasGetAllGQL } from '../../../../../modules/financiero/moneda/graphql/monedasGetAll';
import { Moneda } from '../../../../../modules/financiero/moneda/moneda.model';

export interface RedondeoDialogData {
  isRedondeo: boolean;
  moneda: Moneda;
  valor: number;
}

interface RedondeoDialogResponseData {
  moneda: Moneda;
  valor: number;
}

@Component({
  selector: 'app-redondeo-dialog',
  templateUrl: './redondeo-dialog.component.html',
  styleUrls: ['./redondeo-dialog.component.css']
})
export class RedondeoDialogComponent implements OnInit {

  valorInicial: number;
  valorRedondeado: number;
  selectedMoneda: Moneda;
  isRedondeo = true;
  opcionesRedondeo: number[] = []
  monedas: Moneda[] = []

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RedondeoDialogData,
    public dialogRef: MatDialogRef<RedondeoDialogComponent>,
    private getMonedas: MonedasGetAllGQL
  ) { 
    this.selectedMoneda = data.moneda;
    this.isRedondeo = data.isRedondeo;
    this.valorInicial = data.valor;
  }

  ngOnInit(): void {
    this.createRedondeos()

    this.getMonedas.fetch().subscribe(res => {
      if(!res.errors){
        this.monedas = res.data.data;
      }
    })
  }

  createRedondeos(){
    switch (this.selectedMoneda.denominacion) {
      case 'GUARANI':
        this.opcionesRedondeo.push(Math.round(this.valorInicial - 1000))
        this.opcionesRedondeo.push(Math.round(this.valorInicial - 500))        
        this.opcionesRedondeo.push(Math.round(this.valorInicial + 500))        
        this.opcionesRedondeo.push(Math.round(this.valorInicial + 1000)) 
        console.log(this.opcionesRedondeo)       
        break;
      default:
        let enteros = Math.floor(this.valorInicial);
        this.opcionesRedondeo.push(enteros)
        this.opcionesRedondeo.push(enteros + 0.50)
        this.opcionesRedondeo.push(enteros + 0.25)
        this.opcionesRedondeo.push(enteros + 0.75)
        this.opcionesRedondeo.push(enteros + 1)
        console.log(this.opcionesRedondeo)
        break;
    }
  }

  cambiarMoneda(moneda: Moneda){
    let valorFinal = this.valorInicial;
    this.dialogRef.close({
      moneda
    })
  }

  selectRedondeo(valor){
    this.dialogRef.close({
      moneda: this.selectedMoneda,
      valor
    })
  }

}
