import { AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CurrencyMask, NumberUtils } from '../../../../../commons/core/utils/numbersUtils';
import { Moneda } from '../../../../../modules/financiero/moneda/moneda.model';

export interface DescuentoDialogData {
  valor: number;
  moneda: Moneda;
}

@Component({
  selector: 'app-descuento-dialog',
  templateUrl: './descuento-dialog.component.html',
  styleUrls: ['./descuento-dialog.component.css']
})
export class DescuentoDialogComponent implements OnInit {

  @ViewChild('valorInput', {static: false})
  valorInput : ElementRef;

  @ViewChild('porcentajeInput', {static: false})
  porcentajeInput : ElementRef;

  porcentaje: number;
  formGroup: FormGroup;
  numberUtils = new CurrencyMask;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DescuentoDialogData,
    public dialogRef: MatDialogRef<DescuentoDialogComponent>,
  ) { 

    console.log(this.valorInput)
  }
  

  ngOnInit(): void {
    this.createForm()
    setTimeout(() => {
      console.log(this.valorInput)
      this.valorInput.nativeElement.focus()
      this.valorInput.nativeElement.select()
    }, 100);  
  }

  createForm(){
    this.formGroup = new FormGroup({
      valor: new FormControl(null),
      porcentaje: new FormControl(null),
    })

    this.formGroup.controls.valor.setValue(0)
    this.formGroup.controls.porcentaje.setValue(0)
  }

  onAceptarClick(){

  }

  onValorInputFocus(){
    setTimeout(() => {
      this.valorInput.nativeElement.select()
    }, 100);
  }

  onDescuentoInputFocus(){
    setTimeout(() => {
      this.porcentajeInput.nativeElement.select()
    }, 100);
  }

}
