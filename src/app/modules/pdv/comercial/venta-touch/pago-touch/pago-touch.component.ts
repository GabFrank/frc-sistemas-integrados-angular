import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatAutocompleteTrigger } from "@angular/material/autocomplete";
import { MatButton } from "@angular/material/button";
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from "@angular/material/dialog";
import { CurrencyMaskInputMode } from "ngx-currency";
import { Subscription } from "rxjs";
import { MainService } from "../../../../../main.service";
import { MonedasGetAllGQL } from "../../../../../modules/financiero/moneda/graphql/monedasGetAll";
import { Moneda } from "../../../../../modules/financiero/moneda/moneda.model";
import {
  NotificacionSnackbarService
} from "../../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../../shared/components/dialogos/dialogos.service";
import { TecladoNumericoComponent } from "../../../../../shared/components/teclado-numerico/teclado-numerico.component";
import { FormaPago } from "../../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../../financiero/forma-pago/forma-pago.service";
import {
  SeleccionarBilletesTouchComponent,
  SelectBilletesResponseData
} from "../seleccionar-billetes-touch/seleccionar-billetes-touch.component";


export interface PagoData {
  valor: number;
  itemList: VentaItem[];
  descuento?: number;
  delivery?: Delivery;
}

export interface PagoResponseData {
  cobroDetalleList: CobroDetalle[];
  facturado?: boolean;
  ventaCredito?: VentaCredito;
  itens?: VentaCreditoCuotaInput[];
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { AddFacturaLegalDialogComponent } from "../../../../financiero/factura-legal/add-factura-legal-dialog/add-factura-legal-dialog.component";
import { AddVentaCreditoDialogComponent } from "../../../../financiero/venta-credito/add-venta-credito-dialog/add-venta-credito-dialog.component";
import { VentaCredito, VentaCreditoCuotaInput } from "../../../../financiero/venta-credito/venta-credito.model";
import { VentaItem } from "../../../../operaciones/venta/venta-item.model";
import { Venta } from "../../../../operaciones/venta/venta.model";
import { DescuentoDialogComponent, DescuentoDialogData } from "./descuento-dialog/descuento-dialog.component";
import { Delivery } from "../../../../operaciones/delivery/delivery.model";
import { VentaService } from "../../../../operaciones/venta/venta.service";
import { CobroDetalle } from "../../../../operaciones/venta/cobro/cobro-detalle.model";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-pago-touch",
  templateUrl: "./pago-touch.component.html",
  styleUrls: ["./pago-touch.component.css"],
})
export class PagoTouchComponent implements OnInit, OnDestroy, AfterViewInit {
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
  @ViewChild('container', { read: ElementRef }) container: ElementRef;

  monedas: Moneda[] = [];
  selectedMoneda: Moneda;
  selectedFormaPago: FormaPago;
  formGroup: FormGroup;
  cobroDetalle: CobroDetalle;
  cambioRs;
  cambioDs;
  cambioArg;
  cobroDetalleList: CobroDetalle[] = [];
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

  isLoaded = 0;

  constructor(
    private getMonedas: MonedasGetAllGQL,
    public mainService: MainService,
    private matDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: PagoData,
    public dialogRef: MatDialogRef<PagoTouchComponent>,
    private dialog: DialogosService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private formaPagoService: FormaPagoService,
    private cargandoDialog: CargandoDialogService,
    private ventaService: VentaService
  ) {
    this.formaPagoList = [];
    if (data.delivery != null) {
      data.valor += data.delivery.precio.valor;
    }
  }

  ngOnInit(): void {
    this.cargandoDialog.openDialog();
    //inicializando arrays
    //
    this.setPrecios();
    this.getFormaPagos();
    this.createForm();
    setTimeout(() => {
      this.setFocusToValorInput()
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
      this.isLoaded++;
    });
    this.formaPagoSub = this.formaPagoService.formaPagoSub.pipe(untilDestroyed(this)).subscribe((res) => {
      this.formaPagoList = res;
      if (this.formaPagoList?.length > 0) {
        this.setFormaPago(this.formaPagoList[0]?.descripcion);
      }
      this.isLoaded++;
    });

    let loadTimer = setInterval(() => {
      if (this.isLoaded == 2) {
        if (this.data.descuento > 0) {
          let item = new CobroDetalle;
          item.formaPago = this.selectedFormaPago
          item.moneda = this.selectedMoneda
          item.valor = this.data.descuento
          item.vuelto = false
          item.descuento = true
          item.aumento = false
          item.pago = false
          this.valorParcialPagado += item.valor;
          this.formGroup
            .controls
            .valor
            .setValue(this.data.valor - this.valorParcialPagado);
          this.formGroup.controls.saldo.setValue(this.data.valor - this.valorParcialPagado);
          this.cobroDetalleList.push(item);
        }
        if (this.data.delivery != null) {
          this.data.delivery.venta.cobro.cobroDetalleList.forEach(c => {
            this.isDescuento = c.descuento;
            this.isAumento = c.aumento;
            this.setFormaPago(c.formaPago?.descripcion)
            this.setMoneda(c.moneda?.denominacion, false)
            this.formGroup.get('valor').setValue(c.valor)
            this.addCobroDetalle(null, c);
          })
        }
        clearInterval(loadTimer)
      }

    }, 500);

    // setTimeout(() => {
    //   if (this.data?.delivery != null) {
    //     this.data?.delivery?.venta?.cobro?.cobroDetalleList.forEach(cd => {
    //       this.setMoneda(cd.moneda.denominacion, false)
    //       this.setFormaPago(cd.formaPago.descripcion)
    //       this.formGroup.get("valor").setValue(cd.valor)
    //       this.isAumento = false;
    //       this.isDescuento = false;
    //       this.addCobroDetalle();
    //     });
    //   }
    // }, 1000);
  }


  // agrega un listener en el container raiz del componente para escuchar las teclas presionadas
  ngAfterViewInit(): void {
    this.container.nativeElement.addEventListener("keydown", (e) => {
      if (!this.isDialogOpen) {
        switch (e.key) {
          case "F1":
            this.setMoneda("GUARANI", false);
            break;
          case "F2":
            this.setMoneda("REAL", false);
            break;
          case "F3":
            this.setMoneda("DOLAR", false);
            break;
          case "F4":
            this.setFormaPago('EFECTIVO')
            break;
          case "F5":
            this.setFormaPago('TARJETA')
            break;
          case "F6":
            this.onConvenioClick()
            break;
          case "Escape":
            break;
          case "Enter":
            if (!this.isDialogOpen) {
              if (this.formGroup.controls.saldo.value == 0) {
                this.onFinalizar();
              } else {
                this.addCobroDetalle();
              }
            }
            break;
          case "F10":
            if (!this.isDialogOpen) {
              if (this.formGroup.controls.saldo.value == 0) {
                this.onFinalizar();
              } else {
                this.addCobroDetalle();
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
    })
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
      this.setFormaPago(this.selectedFormaPago.descripcion)
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

  // @HostListener("document:keyup", ["$event"]) onKeydownHandler(
  //   event: KeyboardEvent
  // ) {
  //   if (!this.isDialogOpen) {

  //   }

  // }

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
        this.setFocusToValorInput()
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
    if (this.selectedFormaPago.descripcion == 'CONVENIO') {
      this.onConvenioClick()
    }
  }

  displayFormaPago(value?: number) {
    let res = value ? this.formaPagoList?.find((_) => _.id === value) : undefined;
    this.selectedFormaPago = res;
    console.log(res);
    return res ? res?.id + " - " + res?.descripcion : undefined;
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
            this.addCobroDetalle();
          }
          setTimeout(() => {
            this.setFocusToValorInput()
          }, 0);
          this.isDialogOpen = false;
        });
    }
  }

  setFormaPago(formaPago) {
    if (this.formaPagoList?.length > 0) {
      this.selectedFormaPago = this.formaPagoList.find(fp => fp.descripcion == formaPago);
      if (this.selectedFormaPago != null) {
        this.formGroup.controls.formaPago.setValue(
          this.selectedFormaPago.id
        );
      } else {
        this.notificacionSnackbar.openWarn('Forma de pago no válida')
      }
    }
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

  addCobroDetalle(selectedValor?: number, selectedItem?: CobroDetalle) {
    let valor = selectedValor != null ? selectedValor : this.formGroup.get("valor").value;
    let saldo = this.formGroup.get("saldo").value;
    if (saldo == 0) {
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
      let item = new CobroDetalle;
      if (selectedItem != null) Object.assign(item, selectedItem);
      item.formaPago = this.selectedFormaPago
      item.moneda = this.selectedMoneda
      item.cambio = this.selectedMoneda.cambio
      item.valor = valor
      item.vuelto = this.isVuelto
      item.descuento = this.isDescuento
      item.aumento = this.isAumento
      item.pago = (!this.isVuelto && !this.isDescuento && !this.isAumento)
      this.valorParcialPagado += item.valor * item.moneda.cambio;

      this.formGroup
        .get("valor")
        .setValue((this.data.valor - this.valorParcialPagado) / this.selectedMoneda.cambio);
      this.formGroup.controls.saldo.setValue(
        (this.data.valor - this.valorParcialPagado)
      );
      if (this.data?.delivery != null && item?.id == null) {
        item.cobro = this.data?.delivery?.venta?.cobro;
        this.ventaService.onSaveCobroDetalle(item.toInput()).subscribe(cbRes => {
          if (cbRes != null) {
            item.id = cbRes.id;
            this.cobroDetalleList.push(item);
          }
        })
      } else {
        this.cobroDetalleList.push(item);
      }
    }
    this.isVuelto = false;
    this.isDescuento = false;
    this.isAumento = false;
    this.setFormaPago(this.formaPagoList[0]?.descripcion);
  }

  setFocusToValorInput() {
    this.valorInput.nativeElement.focus();
    setTimeout(() => {
      this.valorInput.nativeElement.select();
    }, 100);
  }

  onFinalizar(ventaCredito?: VentaCredito, itens?: VentaCreditoCuotaInput[]) {
    let response: PagoResponseData = { cobroDetalleList: this.cobroDetalleList, facturado: this.facturado, ventaCredito: ventaCredito, itens: itens };
    this.dialogRef.close(response);
  }

  onDeleteItem(item: CobroDetalle, i) {
    this.valorParcialPagado -= item.valor * item.moneda.cambio;
    console.log(this.data.valor, this.valorParcialPagado, this.selectedMoneda.cambio);
    this.formGroup.controls.saldo.setValue(
      (this.data.valor - this.valorParcialPagado)
    );
    this.formGroup.controls.valor.setValue(
      (this.data.valor - this.valorParcialPagado) / this.selectedMoneda.cambio
    );
    this.cobroDetalleList.splice(i, 1);
    this.setFocusToValorInput();
  }

  onDescuento() {
    this.isDialogOpen = true;
    // let valor =
    //   this.formGroup.controls.valor.value * this.selectedMoneda.cambio;
    // if (valor < this.data.valor * 0.8 && valor > 0) {
    //   this.isDescuento = true;
    //   this.isVuelto = false;
    //   this.isAumento = false;
    //   this.addCobroDetalle();
    // }
    let total = this.data.valor;
    let saldo = this.formGroup?.controls?.saldo?.value;

    let data: DescuentoDialogData = {
      valorTotal: total,
      cambioDs: this.cambioDs,
      cambioRs: this.cambioRs,
      saldo: saldo
    }
    this.matDialog.open(DescuentoDialogComponent, {
      data: data
    }).afterClosed().subscribe(res => {
      this.isDialogOpen = false;
      if (res > 0) {
        let valor = res;
        if (valor < (this.data.valor * 0.25)) {
          this.isAumento = false;
          this.isVuelto = false;
          this.isDescuento = true;
          this.formGroup.controls.valor.setValue(valor)
          this.addCobroDetalle();
        }
      }
    })
  }

  onAumento() {
    let valor =
      this.formGroup.controls.valor.value;
    if (valor < this.data.valor * 0.5 && valor < 0) {
      this.isAumento = true;
      this.isVuelto = false;
      this.isDescuento = false;
      this.addCobroDetalle();
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
      if (res) {
        this.facturado = res;
      }
      this.isDialogOpen = false;
      setTimeout(() => {
        this.setFocusToValorInput()
      }, 0);
    })
  }

  onConvenioClick() {
    this.isDialogOpen = true;
    this.setFormaPago('CONVENIO')
    this.matDialog.open(AddVentaCreditoDialogComponent, { width: '100%', height: '80%', data: { valor: this.formGroup?.controls?.saldo?.value } }).afterClosed()
      .subscribe(res => {
        if (res?.ventaCredito != null) {
          let ventaCredito: VentaCredito = res['ventaCredito'];
          let cobroDetalle = new CobroDetalle();
          cobroDetalle.pago = true;
          cobroDetalle.descuento = false;
          cobroDetalle.aumento = false;
          cobroDetalle.formaPago = this.selectedFormaPago;
          cobroDetalle.moneda = this.monedas.find(m => m.denominacion == 'GUARANI');
          cobroDetalle.valor = this.formGroup?.controls?.saldo?.value
          this.cobroDetalleList.push(cobroDetalle);
          this.onFinalizar(ventaCredito, res['itens'])
        }
      });
  }

  onFirmaClick() {
    this.isDialogOpen = true;
    this.setFormaPago('FIRMA')
    this.matDialog.open(AddVentaCreditoDialogComponent, { width: '100%', height: '80%', data: { valor: this.formGroup?.controls?.saldo?.value } }).afterClosed()
      .subscribe(res => {
        if (res['ventaCredito'] != null) {
          let ventaCredito: VentaCredito = res['ventaCredito'];
          let cobroDetalle = new CobroDetalle();
          cobroDetalle.pago = true;
          cobroDetalle.descuento = false;
          cobroDetalle.aumento = false;
          cobroDetalle.formaPago = this.selectedFormaPago;
          cobroDetalle.moneda = this.monedas.find(m => m.denominacion == 'GUARANI');
          cobroDetalle.valor = this.formGroup?.controls?.saldo?.value
          this.cobroDetalleList.push(cobroDetalle);
          this.onFinalizar(ventaCredito, res['itens'])
        }
      });
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.formaPagoSub.unsubscribe();
  }
}
