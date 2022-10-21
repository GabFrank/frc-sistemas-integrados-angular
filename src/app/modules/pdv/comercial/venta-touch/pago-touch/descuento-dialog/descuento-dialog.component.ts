import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CurrencyMaskInputMode } from "ngx-currency";
import { MonedaService } from '../../../../../financiero/moneda/moneda.service';

export class DescuentoDialogData {
  valorTotal: number;
  saldo: number;
  cambioRs: number;
  cambioDs: number;
}

@Component({
  selector: 'app-descuento-dialog',
  templateUrl: './descuento-dialog.component.html',
  styleUrls: ['./descuento-dialog.component.scss']
})
export class DescuentoDialogComponent implements OnInit {

  @ViewChild('porcentaje', { static: false }) porcentajeInput: ElementRef;

  valorDescuentoGsControl = new FormControl(0, Validators.min(0));
  valorDescuentoRsControl = new FormControl(0, Validators.min(0));
  valorDescuentoDsControl = new FormControl(0, Validators.min(0));
  porcentajeDescuento = new FormControl(0, Validators.min(0));

  currencyOptionsGuarani = {
    allowNegative: true,
    precision: 0,
    thousands: ".",
    nullable: false,
    inputMode: CurrencyMaskInputMode.NATURAL,
    align: "right",
    allowZero: true,
    decimal: null,
    prefix: "",
    suffix: "",
    max: null,
    min: null
  };

  currencyOptionsNoGuarani = {
    allowNegative: true,
    precision: 2,
    thousands: ",",
    nullable: false,
    inputMode: CurrencyMaskInputMode.FINANCIAL,
    align: "right",
    allowZero: true,
    decimal: ".",
    prefix: "",
    suffix: "",
    max: null,
    min: null
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: DescuentoDialogData,
    private matDialogRef: MatDialogRef<DescuentoDialogComponent>,
    public monedaService: MonedaService
  ) { }

  ngOnInit(): void {
    this.onKeyUp(1, this.data.saldo)
    setTimeout(() => {
      this.porcentajeInput.nativeElement.select()
    }, 0);
  }

  onKeyUp(i, valor) {
    switch (i) {
      case 1:
        this.valorDescuentoGsControl.setValue(valor)
        break;
      case 2:
        this.valorDescuentoGsControl.setValue(valor * this.data.cambioRs)
        break;
      case 3:
        this.valorDescuentoGsControl.setValue(valor * this.data.cambioDs)
        break;
      case 4:
        this.valorDescuentoGsControl.setValue((this.data.valorTotal * valor) / 100)
        break;
    }
    this.valorDescuentoRsControl.setValue(this.valorDescuentoGsControl.value / this.data.cambioRs)
    this.valorDescuentoDsControl.setValue(this.valorDescuentoGsControl.value / this.data.cambioDs)
    this.porcentajeDescuento.setValue((this.valorDescuentoGsControl.value * 100) / this.data.valorTotal)
  }

  onCancelar() {
    this.matDialogRef.close(0)
  }

  onGuardar() {
    this.matDialogRef.close(this.valorDescuentoGsControl.value)
  }

}
