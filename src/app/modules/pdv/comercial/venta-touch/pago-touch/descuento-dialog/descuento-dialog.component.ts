import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CurrencyMaskInputMode } from "ngx-currency";
import { MonedaService } from "../../../../../financiero/moneda/moneda.service";

export class DescuentoDialogData {
  valorTotal: number;
  saldo: number;
  cambioRs: number;
  cambioDs: number;
  costo?: number;
}

@Component({
  selector: "app-descuento-dialog",
  templateUrl: "./descuento-dialog.component.html",
  styleUrls: ["./descuento-dialog.component.scss"],
})
export class DescuentoDialogComponent implements OnInit {
  @ViewChild("porcentajeInput", { static: false }) porcentajeInput: ElementRef;

  valorDescuentoGsControl = new FormControl(0, Validators.min(0));
  valorDescuentoRsControl = new FormControl(0, Validators.min(0));
  valorDescuentoDsControl = new FormControl(0, Validators.min(0));
  porcentajeDescuento = new FormControl(0, Validators.min(0));

  descuento5 = 0;
  descuento10 = 0;
  descuento15 = 0;

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
    min: null,
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
    min: null,
  };

  porcentaje = 15;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: DescuentoDialogData,
    private matDialogRef: MatDialogRef<DescuentoDialogComponent>,
    public monedaService: MonedaService
  ) {}

  ngOnInit(): void {
    if (this.data?.costo > 0) {
      let margen = this.data.valorTotal - this.data.costo;
      this.porcentaje = (margen * 100) / this.data.valorTotal;
      this.porcentaje = this.porcentaje + this.porcentaje * 0.05;
    }
    this.porcentajeDescuento.setValidators(Validators.max(this.porcentaje));
    this.porcentajeDescuento.updateValueAndValidity();
    if (this.data.saldo <= this.data.valorTotal * (this.porcentaje / 100)) {
      this.onKeyUp(1, this.data.saldo);
    } else {
      this.onKeyUp(1, 0);
    }
    setTimeout(() => {
      this.porcentajeInput.nativeElement.select();
    }, 500);

    this.descuento5 = this.setDescuento(5)
    this.descuento10 = this.setDescuento(10)
    this.descuento15 = this.setDescuento(15)
  }

  onKeyUp(i, valor) {
    switch (i) {
      case 1:
        this.valorDescuentoGsControl.setValue(valor);
        break;
      case 2:
        this.valorDescuentoGsControl.setValue(valor * this.data.cambioRs);
        break;
      case 3:
        this.valorDescuentoGsControl.setValue(valor * this.data.cambioDs);
        break;
      case 4:
        this.valorDescuentoGsControl.setValue(
          (this.data.valorTotal * valor) / 100
        );
        break;
    }
    this.valorDescuentoRsControl.setValue(
      this.valorDescuentoGsControl.value / this.data.cambioRs
    );
    this.valorDescuentoDsControl.setValue(
      this.valorDescuentoGsControl.value / this.data.cambioDs
    );
    this.porcentajeDescuento.setValue(
      (this.valorDescuentoGsControl.value * 100) / this.data.valorTotal
    );
  }

  onCancelar() {
    this.matDialogRef.close(0);
  }

  onGuardar() {
    this.matDialogRef.close(this.valorDescuentoGsControl.value);
  }

  setDescuento(descuento: number) {
    let discount = this.data.valorTotal * (+descuento / 100);
    let originalDiscount = discount;

    // Adjust the discount to make it divisible by 500 or 1000
    let remainder500 = discount % 500;
    let remainder1000 = discount % 1000;

    if (remainder500 <= 250 && remainder500 !== 0) {
      // If the remainder is less than or equal to 250, subtract it from the discount
      discount -= remainder500;
    } else if (remainder500 > 250) {
      // If the remainder is greater than 250, check if adding the difference to make it divisible by 500 exceeds the original discount
      if (discount + (500 - remainder500) <= originalDiscount) {
        discount += 500 - remainder500;
      } else {
        discount -= remainder500;
      }
    } else if (remainder1000 !== 0) {
      // If the remainder is not 0 when divided by 1000, adjust the discount to make it divisible by 1000
      // But first, check if it doesn't exceed the original discount
      if (discount + (1000 - remainder1000) <= originalDiscount) {
        discount += 1000 - remainder1000;
      }
    }
    return discount;
  }
}
