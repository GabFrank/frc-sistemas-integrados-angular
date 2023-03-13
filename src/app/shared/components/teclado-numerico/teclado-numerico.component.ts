import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CurrencyMaskInputMode } from 'ngx-currency';

export class TecladoData {
  numero;
  financial?: boolean = false; // atributo que indica que es moneda con decimales
}

@Component({
  selector: 'app-teclado-numerico',
  templateUrl: './teclado-numerico.component.html',
  styleUrls: ['./teclado-numerico.component.css']
})
export class TecladoNumericoComponent implements OnInit, AfterViewInit {

  @ViewChild('cantidadInput', {static: false}) cantidadInput: ElementRef;

  formGroup;
  multiplicar = false;

  currencyOptionsGuarani = {
    allowNegative: true,
    precision: 0,
    thousands: '.',
    nullable: false,
    inputMode: CurrencyMaskInputMode.NATURAL,
    align: 'right',
    allowZero: true,
    decimal: null,
    prefix: '',
    suffix: '',
    max: null,
    min: null
  }

  currencyOptionsNoGuarani = {
    allowNegative: true,
    precision: 2,
    thousands: '.',
    nullable: false,
    inputMode: CurrencyMaskInputMode.FINANCIAL,
    align: 'right',
    allowZero: true,
    decimal: ',',
    prefix: '',
    suffix: '',
    max: null,
    min: null
  }

  @ViewChild('doneBtn', {static: true, read: MatButton})
  doneBtn: MatButton;

  constructor(public dialogRef: MatDialogRef<TecladoNumericoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TecladoData) { 
    }

  ngOnInit(): void {
    this.createForm()

  }

  createForm(){
    this.formGroup = new FormGroup({
      cantidad: new FormControl(null)
    });
    if(this.data.numero>1){
      this.formGroup.get('cantidad').setValue(this.data.numero);
    } else {
      this.formGroup.get('cantidad').setValue(0);
    }
    setTimeout(() => {
      this.cantidadInput.nativeElement.select()
    }, 0);
  }

  ngAfterViewInit(): void {
  }

  setCantidad(n: string){
    let cantidad : any = +this.formGroup.get('cantidad').value;
    console.log(cantidad, n)
    switch (n) {
      case 'borrar':
        if(this.data.financial){
          if(cantidad < 0.01) {
            this.formGroup.get('cantidad').setValue(0)
          } else {
            this.formGroup.get('cantidad').setValue(cantidad*0.1);        
          }
        } else {
          this.formGroup.get('cantidad').setValue(Math.floor(cantidad*0.1));        
        }
        break;
      case 'clear':
        this.formGroup.get('cantidad').setValue(0);
        break;
      case 'done':
        this.dialogRef.close(cantidad);
        break;
      case '*':
        this.multiplicar = true;
        break;
      default:
        if(this.multiplicar){
          cantidad = +cantidad * +n;
        } else {
          if(this.data.financial){
            cantidad = (cantidad * 10) + (+n * 0.01)
          } else {
            cantidad = (cantidad * 10) + +n;
          }
        }
        this.formGroup.get('cantidad').setValue(cantidad);
        break;
    }
  }

}

/*
0 = 0,00
1 = 0,00 + (1 * 0,01) = 0,01
2 = (0,01 * 10) + (2 * 0,01 ) = 0,12
3 = (0,12 * 10) + (3 * 0,01 ) = 0,12

*/
