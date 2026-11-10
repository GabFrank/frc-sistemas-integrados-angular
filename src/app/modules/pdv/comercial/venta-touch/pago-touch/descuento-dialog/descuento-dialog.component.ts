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
import { Moneda } from "../../../../../financiero/moneda/moneda.model";
import { redondearDescuento } from "../../moneda-pdv.util";

export class DescuentoDialogData {
  valorTotal: number;
  saldo: number;
  /** Cuántas unidades de la moneda base vale 1 R$ (con base == empresa, el cambio de siempre). */
  cambioRs: number;
  /** Idem para 1 US$. */
  cambioDs: number;
  /**
   * Lo máximo que puede llevar ESTE descuento, en la moneda base: el tope configurado en Cobro en PDV menos
   * los descuentos que el cobro ya tiene (los de producto incluidos). `null`/sin definir = sin tope.
   */
  tope?: number | null;
  /** El mensaje que se muestra si el cajero pasa el tope. */
  mensajeTope?: string;
  /**
   * La moneda base del cobro (la del PDV), solo cuando NO es la de la empresa (Fase 4): `valorTotal`, `saldo` y el
   * valor que devuelve el diálogo están en ella. Sin definir, son guaraníes como siempre.
   */
  monedaBase?: Moneda;
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

  /** El máximo porcentaje del total que admite este descuento (100 sin tope). */
  porcentaje = 100;
  tope: number | null = null;
  mensajeTope = '';
  ocultarRs = false;
  ocultarDs = false;

  /** Cómo se llama la moneda base en el primer campo y cuántos decimales tiene. Guaraní y 0 salvo Fase 4. */
  nombreMonedaBase = "Guaranies";
  decimalesBase = 0;
  optionsBase: any = this.currencyOptionsGuarani;
  formatoBase = "1.0-0";

  // Sin cotización el campo de esa moneda se deshabilita: con null, `valor * null === 0` guardaba
  // en silencio un descuento de 0 Gs.
  sinCotizacionRs = false;
  sinCotizacionDs = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: DescuentoDialogData,
    private matDialogRef: MatDialogRef<DescuentoDialogComponent>,
    public monedaService: MonedaService
  ) {}

  ngOnInit(): void {
    if (this.data?.monedaBase != null) {
      const m = this.data.monedaBase;
      this.decimalesBase = this.monedaService.decimalesDeMoneda(m);
      this.nombreMonedaBase = m.denominacion ? m.denominacion.charAt(0) + m.denominacion.slice(1).toLowerCase() : "la moneda del PDV";
      this.optionsBase = this.monedaService.currencyOptionsByMoneda(m);
      this.formatoBase = this.decimalesBase > 0 ? `1.${this.decimalesBase}-${this.decimalesBase}` : "1.0-0";
      // La fila fija de la misma moneda que la base repetiria el campo de arriba.
      const d = (m.denominacion || "").toUpperCase();
      this.ocultarRs = d === "REAL";
      this.ocultarDs = d === "DOLAR";
    }
    this.sinCotizacionRs = !this.data?.cambioRs;
    this.sinCotizacionDs = !this.data?.cambioDs;
    if (this.sinCotizacionRs) this.valorDescuentoRsControl.disable();
    if (this.sinCotizacionDs) this.valorDescuentoDsControl.disable();
    // Solo el tope de Configuración › Cobro en PDV. El límite por margen de antes (margen + 5%) se quitó:
    // avisaba «Valor no permitido» pero dejaba guardar igual.
    if (this.data?.tope != null) {
      this.tope = Math.max(0, this.data.tope);
      this.mensajeTope = this.data.mensajeTope ?? '';
      this.porcentaje = this.data.valorTotal > 0 ? (this.tope * 100) / this.data.valorTotal : 0;
    }
    this.porcentajeDescuento.setValidators(Validators.max(this.porcentaje));
    this.porcentajeDescuento.updateValueAndValidity();
    // Siempre arranca en 0%: precargar el saldo (100% sin tope) hacía que un Enter de más regalara la venta.
    this.onKeyUp(1, 0);
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
        if (this.sinCotizacionRs) return;
        this.valorDescuentoGsControl.setValue(valor * this.data.cambioRs);
        break;
      case 3:
        if (this.sinCotizacionDs) return;
        this.valorDescuentoGsControl.setValue(valor * this.data.cambioDs);
        break;
      case 4:
        this.valorDescuentoGsControl.setValue(
          (this.data.valorTotal * valor) / 100
        );
        break;
    }
    this.valorDescuentoRsControl.setValue(
      this.sinCotizacionRs ? null : this.valorDescuentoGsControl.value / this.data.cambioRs
    );
    this.valorDescuentoDsControl.setValue(
      this.sinCotizacionDs ? null : this.valorDescuentoGsControl.value / this.data.cambioDs
    );
    this.porcentajeDescuento.setValue(
      (this.valorDescuentoGsControl.value * 100) / this.data.valorTotal
    );
  }

  onCancelar() {
    this.matDialogRef.close(0);
  }

  /** Si el monto pasa el tope (comparado en centésimos, por los decimales de otra moneda). */
  excede(valor: number): boolean {
    return this.tope != null && Math.round((+valor || 0) * 100) > Math.round(this.tope * 100);
  }

  onGuardar() {
    // Pasado el tope no se cierra: el cajero corrige el monto o cancela.
    if (this.excede(this.valorDescuentoGsControl.value)) return;
    this.matDialogRef.close(this.valorDescuentoGsControl.value);
  }

  setDescuento(descuento: number) {
    // Redondeado hacia abajo a 500 / 1000 (sin decimales, como siempre) o a 0,05 / 0,10 (con decimales).
    return redondearDescuento(this.data.valorTotal * (+descuento / 100), this.decimalesBase);
  }
}
