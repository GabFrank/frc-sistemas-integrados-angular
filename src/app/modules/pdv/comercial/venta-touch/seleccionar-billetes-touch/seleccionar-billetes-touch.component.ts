import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Moneda } from '../../../../../modules/financiero/moneda/moneda.model';
import { PagoData, PagoTouchComponent } from '../pago-touch/pago-touch.component';

export interface SelectBilleteData {
  moneda: Moneda;
  isVuelto: boolean;
  valor: number;
}

export interface BilleteItem {
  valor: number;
  cantidad: number;
}

export interface SelectBilletesResponseData {
  valor: number;
  moneda: Moneda;
  billetesList: BilleteItem[];
  isVuelto: boolean;
}

@Component({
  selector: 'app-seleccionar-billetes-touch',
  templateUrl: './seleccionar-billetes-touch.component.html',
  styleUrls: ['./seleccionar-billetes-touch.component.css']
})
export class SeleccionarBilletesTouchComponent implements OnInit {

  selectedBilletes;
  selectedMonedas;
  imageHeigth = '40vh';
  formGroup: FormGroup;
  billeteItemList: BilleteItem[] = [];
  numberFormat = '1.0-0'

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SelectBilleteData,
    public dialogRef: MatDialogRef<PagoTouchComponent>,
  ) {
    console.log(data)
    switch (data.moneda.denominacion) {
      case 'GUARANI':
        this.selectedBilletes = this.guaraniBilletes.sort((a,b) => this.filtrar(a,b));
        this.selectedMonedas = this.guaraniMonedas.sort((a,b) => this.filtrar(a,b));
        this.imageHeigth = '15vw'
        this.numberFormat = '1.0-0'

        break;
      case 'REAL':
        this.selectedBilletes = this.realBilletes.sort((a,b) => this.filtrar(a,b));
        this.selectedMonedas = this.realMonedas.sort((a,b) => this.filtrar(a,b));
        this.imageHeigth = '15vw'
        this.numberFormat = '1.2-2'
        break;
      case 'DOLAR':
        this.selectedBilletes = this.dolarBilletes.sort((a,b) => this.filtrar(a,b));
        this.selectedMonedas = null;
        this.imageHeigth = '15vw'
        this.numberFormat = '1.2-2'

        break;
    
      default:
        break;
    }
   }

  filtrar(a,b): number{
    if(a.valor < b.valor){
      return -1
    } else {
      return 1
    }
   }

  ngOnInit(): void {
    this.createForm()
  }

  createForm(){
    this.formGroup = new FormGroup({
      cantidad: new FormControl(null),
      total: new FormControl(null),
      saldo: new FormControl(null)
    })

    console.log(this.data)

    this.formGroup.controls.cantidad.setValue(1);
    this.formGroup.controls.total.setValue(0);
    this.formGroup.controls.saldo.setValue(this.data.valor);
  }

  calcularCantidad(n){
    let cantidad = this.formGroup.controls.cantidad.value;
    if(cantidad == 1){
      cantidad = n;
    } else {
    cantidad += n;
    }
    this.formGroup.controls.cantidad.setValue(cantidad);
  }

  clearCantidad(){
    this.formGroup.controls.cantidad.setValue(1);
  }

  addBilleteItem(valor){
    let billeteItem: BilleteItem = {
      valor : valor,
      cantidad : this.formGroup.controls.cantidad.value
    }
    this.billeteItemList.push(billeteItem);
    let total = this.formGroup.controls.total.value;
    if(this.data.isVuelto){
      this.formGroup.controls.total.setValue(total -= (billeteItem.valor * billeteItem.cantidad))
    } else {
      this.formGroup.controls.total.setValue(total += (billeteItem.valor * billeteItem.cantidad))
    }
    this.clearCantidad()
  }

  onDeleteItem(item, i){
    this.billeteItemList.splice(i, 1);
    let total = this.formGroup.controls.total.value;
    this.formGroup.controls.total.setValue(total -= (item.valor * item.cantidad))
  }

  onAceptarClick(){
    let response : SelectBilletesResponseData= {
      moneda: this.data.moneda,
      valor: this.formGroup.controls.total.value,
      billetesList : this.billeteItemList,
      isVuelto: this.data.isVuelto
    }
    if(response.valor != 0){
      this.dialogRef.close(response)
    } else {
      this.dialogRef.close(null)
    }
  }

  @HostListener('document:keydown', ['$event']) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case 'Escape':
        break;
      case 'Enter':
        this.onAceptarClick()
        break;
      case 'F9':
        break;
      default:
        break;
    }
  }

  guaraniMonedas = [
    {
      path: 'assets/monedas/guaranies/50gs.png',
      valor: 50,
    },
    {
      path: 'assets/monedas/guaranies/100gs.png',
      valor: 100
    },
    {
      path: 'assets/monedas/guaranies/500gs.png',
      valor: 500
    },
    {
      path: 'assets/monedas/guaranies/1000gs.png',
      valor: 1000
    },
  ]

  guaraniBilletes = [
    {
      path: 'assets/monedas/guaranies/2000gs.jpeg',
      valor: 2000
    },
    {
      path: 'assets/monedas/guaranies/5000gs.jpeg',
      valor: 5000
    },
    {
      path: 'assets/monedas/guaranies/10000gs.jpeg',
      valor: 10000
    },
    {
      path: 'assets/monedas/guaranies/20000gs.jpeg',
      valor: 20000
    },
    {
      path: 'assets/monedas/guaranies/50000gs.jpeg',
      valor: 50000
    },
    {
      path: 'assets/monedas/guaranies/100000gs.jpeg',
      valor: 100000
    },
  ]

  realMonedas = [
    {
      path: 'assets/monedas/reales/005rs.png',
      valor: 0.05
    },
    {
      path: 'assets/monedas/reales/010rs.png',
      valor: 0.10
    },
    {
      path: 'assets/monedas/reales/025rs.png',
      valor: 0.25
    },
    {
      path: 'assets/monedas/reales/05rs.png',
      valor: 0.50
    },
    {
      path: 'assets/monedas/reales/1rs.png',
      valor: 1
    },
  ]

  realBilletes = [
    {
      path: 'assets/monedas/reales/2rs.jpeg',
      valor: 2
    },
    {
      path: 'assets/monedas/reales/5rs.jpeg',
      valor: 5
    },
    {
      path: 'assets/monedas/reales/10rs.jpeg',
      valor: 10
    },
    {
      path: 'assets/monedas/reales/20rs.jpeg',
      valor: 20
    },
    {
      path: 'assets/monedas/reales/50rs.jpeg',
      valor: 50
    },
    {
      path: 'assets/monedas/reales/100rs.jpeg',
      valor: 100
    },

    {
      path: 'assets/monedas/reales/200rs.jpeg',
      valor: 200
    },
  ]

  dolarBilletes = [
    {
      path: 'assets/monedas/dolares/1us.jpeg',
      valor: 1
    },
    {
      path: 'assets/monedas/dolares/5us.jpeg',
      valor: 5
    },
    {
      path: 'assets/monedas/dolares/10us.jpeg',
      valor: 10
    },
    {
      path: 'assets/monedas/dolares/20us.jpeg',
      valor: 20
    },
    {
      path: 'assets/monedas/dolares/50us.jpeg',
      valor: 50
    },
    {
      path: 'assets/monedas/dolares/100us.jpeg',
      valor: 100
    }
  ]

}
