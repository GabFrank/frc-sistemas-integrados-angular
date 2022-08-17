import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatButton } from "@angular/material/button";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from "@angular/material/dialog";
import { CurrencyMaskConfig, CurrencyMaskInputMode } from "ngx-currency";
import { Subscription } from "rxjs";
import { CurrencyMask } from "../../../../../commons/core/utils/numbersUtils";
import { MainService } from "../../../../../main.service";
import { monedasSearch } from "../../../../../modules/financiero/moneda/graphql/graphql-query";
import { MonedasGetAllGQL } from "../../../../../modules/financiero/moneda/graphql/monedasGetAll";
import { MonedasSearchGQL } from "../../../../../modules/financiero/moneda/graphql/monedasSearch";
import { Moneda } from "../../../../../modules/financiero/moneda/moneda.model";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosComponent } from "../../../../../shared/components/dialogos/dialogos.component";
import { DialogosService } from "../../../../../shared/components/dialogos/dialogos.service";
import { TecladoNumericoComponent } from "../../../../../shared/components/teclado-numerico/teclado-numerico.component";
import { FormaPago } from "../../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../../financiero/forma-pago/forma-pago.service";
import { DescuentoDialogComponent } from "../descuento-dialog/descuento-dialog.component";
import {
  SeleccionarBilletesTouchComponent,
  SelectBilletesResponseData,
} from "../seleccionar-billetes-touch/seleccionar-billetes-touch.component";
import { TarjetaDialogComponent } from "../tarjeta-dialog/tarjeta-dialog.component";
import { VueltoDialogComponent } from "../vuelto-dialog/vuelto-dialog.component";

export interface PagoItem {
  index?;
  moneda: Moneda;
  formaPago: FormaPago;
  valor: number;
  vuelto?: boolean;
  descuento?: boolean;
  aumento?: boolean;
  pago?: boolean
  itemList?: VentaItem[];
}

export interface PagoData {
  valor: number;
  itemList: VentaItem[]
}

export interface PagoResponseData {
  pagoItemList: PagoItem[];
  facturado?: boolean;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AddFacturaLegalDialogComponent } from "../../../../financiero/factura-legal/add-factura-legal-dialog/add-factura-legal-dialog.component";
import { Venta } from "../../../../operaciones/venta/venta.model";
import { VentaItem } from "../../../../operaciones/venta/venta-item.model";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-pago-touch",
  templateUrl: "./pago-touch.component.html",
  styleUrls: ["./pago-touch.component.css"],
})
export class PagoTouchComponent implements OnInit, OnDestroy {
  @ViewChild("autoMonedaInput", { static: false, read: MatAutocompleteTrigger })
  matMonedaTrigger: MatAutocompleteTrigger;
  @ViewChild("autoMonedaInput", { static: false }) autoMonedaInput: ElementRef;

  @ViewChild("autoFormaPagoInput", {
    static: false,
    read: MatAutocompleteTrigger,
  })
  matFormaPagoTrigger: MatAutocompleteTrigger;
  @ViewChild("autoFormaPagoInput", { static: false })
  autoFormaPagoInput: ElementRef;

  @ViewChild("valorInput", { static: false }) valorInput: ElementRef;
  @ViewChild("btnFinalizar", { static: false }) btnFinalizar: MatButton;

  monedas: Moneda[] = [];
  selectedMoneda: Moneda;
  selectedFormaPago: FormaPago;
  formGroup: FormGroup;
  pagoItem: PagoItem;
  cambioRs;
  cambioDs;
  cambioArg;
  pagoItemList: PagoItem[] = [];
  valorParcialPagado = 0;
  isDialogOpen = false;
  isVuelto = false;
  isDescuento = false;
  isAumento = false;
  formaPagoList: FormaPago[];
  formaPagoSub: Subscription;
  facturado = false;

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

  constructor(
    private getMonedas: MonedasGetAllGQL,
    public mainService: MainService,
    private matDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: PagoData,
    public dialogRef: MatDialogRef<PagoTouchComponent>,
    private dialog: DialogosService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private formaPagoService: FormaPagoService,
    private cargandoDialog: CargandoDialogService
  ) {
    this.formaPagoList = [];
  }

  ngOnInit(): void {
    this.cargandoDialog.openDialog();
    //inicializando arrays
    //
    this.setPrecios();
    this.getFormaPagos();
    this.createForm();
    setTimeout(() => {
      this.valorInput.nativeElement.focus();
      this.valorInput.nativeElement.select();
      this.cargandoDialog.closeDialog();
    }, 500);

    this.formGroup.controls.moneda.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      let aux = this.formGroup.controls.valor.value;
      if (this.selectedMoneda != null) {
        setTimeout(() => {
          this.formGroup.controls.valor.setValue(
            (
              (this.data.valor - this.valorParcialPagado) /
              this.selectedMoneda?.cambio
            ).toFixed(2)
          );
        }, 0);
      }
    });
    this.formaPagoSub = this.formaPagoService.formaPagoSub.pipe(untilDestroyed(this)).subscribe((res) => {
      this.formaPagoList = res;
      if (this.formaPagoList?.length > 0) {
        console.log(this.formaPagoList);
        this.setFormaPago(this.formaPagoList[0]);
      }
    });
  }

  createForm() {
    this.formGroup = new FormGroup({
      formaPago: new FormControl(null, Validators.required),
      moneda: new FormControl(null, Validators.required),
      valorTotal: new FormControl(null),
      valor: new FormControl(null, Validators.required),
      saldo: new FormControl(null),
    });

    this.formGroup.get("valorTotal").setValue(this.data.valor);
    this.formGroup.get("valor").setValue(this.data.valor);
    this.formGroup.get("saldo").setValue(this.data.valor);
  }

  getFormaPagos() {
    this.formaPagoService.onGetAllFormaPago().pipe(untilDestroyed(this)).subscribe((res) => {
      this.formaPagoList = res;
      this.selectedFormaPago = this.formaPagoList[0];
    });
  }

  setPrecios() {
    this.getMonedas.fetch().pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res.errors) {
        this.monedas = res.data.data;
        this.cambioRs = this.monedas.find(
          (m) => m.denominacion == "REAL"
        )?.cambio;
        this.cambioDs = this.monedas.find(
          (m) => m.denominacion == "DOLAR"
        )?.cambio;
        this.cambioArg = this.monedas.find(
          (m) => m.denominacion == "PESO ARG"
        )?.cambio;
        this.formGroup.controls.moneda.setValue(
          this.monedas.find((m) => m.denominacion == "GUARANI")?.id
        );
      }
    });
  }

  @HostListener("document:keyup", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    if (!this.isDialogOpen) {
      switch (event.key) {
        case "F1":
          this.setMoneda("GUARANI", false);
          break;
        case "F2":
          this.setMoneda("REAL", false);
          break;
        case "F3":
          this.setMoneda("DOLAR", false);
          break;
        case "Escape":
          break;
        case "Enter":
          if (!this.isDialogOpen) {
            if (this.formGroup.controls.saldo.value == 0) {
              this.onFinalizar();
            } else {
              this.addPagoItem();
            }
          }
          break;
        case "F10":
          if (!this.isDialogOpen) {
            if (this.formGroup.controls.saldo.value == 0) {
              this.onFinalizar();
            } else {
              this.addPagoItem();
            }
          }
          break;
        case "F12":
          this.onFactura()
          break;
        default:
          break;
      }
    }

  }

  onMonedaSearch(a?): void {
    let texto;
    a == null ? (texto = this.formGroup.get("moneda").value) : (texto = a);
    let filteredMonedas = this.monedas.filter((m) => {
      if (m.id == +texto || m.denominacion.match(/.*i.*/)) {
        return m;
      }
    });
    if (filteredMonedas.length == 1) {
      setTimeout(() => {
        this.formGroup.get("moneda").setValue(filteredMonedas[0].id);
        this.valorInput.nativeElement.focus();
        this.valorInput.nativeElement.select();
        this.matMonedaTrigger.closePanel();
      }, 1000);
    }
  }

  displayMoneda(value?: number) {
    let res = value ? this.monedas?.find((_) => _.id === value) : undefined;
    this.selectedMoneda = res;
    this.setFocusToValorInput();
    return res ? res.id + " - " + res.denominacion : undefined;
  }

  onMonedaAutoClosed() {
    this.autoMonedaInput.nativeElement.select();
  }

  onFormaPagoSearch() {
    let texto = this.formGroup.get("formaPago").value;
    let filteredFormaPago = this.formaPagoList.filter((m) => {
      if (m.id == +texto || m.descripcion.match(/.*i.*/)) {
        return m;
      }
    });
    if (filteredFormaPago.length == 1) {
      setTimeout(() => {
        this.formGroup.get("formaPago").setValue(filteredFormaPago[0].id);
        this.autoFormaPagoInput.nativeElement.select();
        this.matFormaPagoTrigger.closePanel();
      }, 1000);
    }
  }

  onFormaPagoAutoClosed() {
    this.autoFormaPagoInput.nativeElement.select();
  }

  setMoneda(moneda, openDialog?) {
    this.selectedMoneda = this.monedas.find((m) => m.denominacion == moneda);
    this.formGroup.controls.moneda.setValue(this.selectedMoneda.id);
    if (openDialog == null) openDialog = true;
    this.setFocusToValorInput();
    if (openDialog == true) {
      this.isDialogOpen = true;
      this.matDialog
        .open(SeleccionarBilletesTouchComponent, {
          autoFocus: false,
          restoreFocus: false,
          data: {
            moneda: this.selectedMoneda,
            isVuelto: this.formGroup.controls.valor.value > 0 ? false : true,
            valor:
              this.data.valor - this.valorParcialPagado,
          },
          width: '60%'
        })
        .afterClosed().pipe(untilDestroyed(this))
        .subscribe((res: SelectBilletesResponseData) => {
          if (res != null) {
            this.formGroup.controls.valor.setValue(res.valor);
            this.isVuelto = res.isVuelto;
            this.addPagoItem();
          }
          setTimeout(() => {
            this.valorInput.nativeElement.focus()
          }, 0);
          this.isDialogOpen = false;
        });
    }
  }

  setFormaPago(formaPago) {
    this.selectedFormaPago = formaPago;
    this.formGroup.controls.formaPago.setValue(
      this.selectedFormaPago.id +
      " - " +
      this.selectedFormaPago.descripcion.toUpperCase()
    );
  }

  onOtrasMonedasClick() { }

  onOtrasFormaPagoClick() { }

  openTecladoNumerico() {
    let ref = this.matDialog.open(TecladoNumericoComponent, {
      data: {
        numero: this.formGroup.get("valor").value,
        financial: this.selectedMoneda.id != 1,
      },
    });
    ref.afterClosed().pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.formGroup.get("valor").setValue(res);
      }
    });
  }

  addPagoItem() {
    
    let valor = this.formGroup.get("valor").value;
    let saldo = this.formGroup.get("saldo").value;
    if(saldo == 0){
      return this.onFinalizar();
    }
    if (this.isDescuento) {
      valor = (this.data.valor - this.valorParcialPagado);
      this.selectedMoneda = this.monedas.find(m => m.denominacion == 'GUARANI');
    }
    if (valor < 0) this.isVuelto = true;
    if (this.selectedFormaPago.descripcion == 'TARJETA' && (this.isVuelto || this.isDescuento || this.isAumento)) {
      this.selectedFormaPago = this.formaPagoList.find(f => f.descripcion == 'EFECTIVO');
    }
    if (this.formGroup.valid && saldo != 0) {
      let item: PagoItem = {
        formaPago: this.selectedFormaPago,
        moneda: this.selectedMoneda,
        valor: valor,
        vuelto: this.isVuelto,
        descuento: this.isDescuento,
        aumento: this.isAumento,
        pago: (!this.isVuelto && !this.isDescuento && !this.isAumento)
      };
      this.valorParcialPagado += item.valor * item.moneda.cambio;

      this.formGroup
        .get("valor")
        .setValue((this.data.valor - this.valorParcialPagado) / this.selectedMoneda.cambio);
      this.formGroup.controls.saldo.setValue(
        (this.data.valor - this.valorParcialPagado)
      );
      this.pagoItemList.push(item);
    }
    this.isVuelto = false;
    this.isDescuento = false;
    this.isAumento = false;
  }

  setFocusToValorInput() {
    if (this.formGroup.controls.saldo.value == 0) {
      setTimeout(() => {
        this.valorInput.nativeElement.select();
      }, 0);
    } else {
      this.valorInput.nativeElement.focus();
      setTimeout(() => {
        this.valorInput.nativeElement.select();
      }, 0);
    }
  }

  onFinalizar() {
    let response: PagoResponseData = { pagoItemList: this.pagoItemList, facturado: this.facturado };
    this.dialogRef.close(response);
  }

  onDeleteItem(item: PagoItem, i) {
    this.valorParcialPagado -= item.valor * item.moneda.cambio;
    console.log(this.data.valor, this.valorParcialPagado, this.selectedMoneda.cambio);
    this.formGroup.controls.saldo.setValue(
      (this.data.valor - this.valorParcialPagado)
    );
    this.formGroup.controls.valor.setValue(
      (this.data.valor - this.valorParcialPagado) / this.selectedMoneda.cambio
    );
    this.pagoItemList.splice(i, 1);
    this.setFocusToValorInput();
  }

  onDescuento() {
    let valor =
      this.formGroup.controls.valor.value * this.selectedMoneda.cambio;
    if (valor < this.data.valor * 0.8 && valor > 0) {
      this.isDescuento = true;
      this.isVuelto = false;
      this.isAumento = false;
      this.addPagoItem();
    }
  }

  onAumento() {
    let valor =
      this.formGroup.controls.valor.value;
    if (valor < this.data.valor * 0.5 && valor < 0) {
      this.isAumento = true;
      this.isVuelto = false;
      this.isDescuento = false;
      this.addPagoItem();
    }
  }

  onTicket() { }

  onPresupuesto() { }

  onFactura() {
    this.isDialogOpen = true
    let venta = new Venta;
    venta.totalGs = this.formGroup.get("valorTotal").value;
    this.matDialog.open(AddFacturaLegalDialogComponent, {
      data: {
        venta,
        ventaItemList: this.data.itemList
      },
      width: '100%'
    }).afterClosed().subscribe(res => {
      if(res){
        this.facturado = res;
      }
      this.isDialogOpen = false;
      setTimeout(() => {
        this.valorInput.nativeElement.focus()
      }, 0);
    })
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.formaPagoSub.unsubscribe();
  }
}
