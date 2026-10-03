import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PROPAGAR_ERROR_DE_RED } from '../../../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { esTimeoutDeLink, TIMEOUT_POR_DEFECTO_MS } from '../../../../../../shared/services/timeout-link';
import { CurrencyMask } from '../../../../../../commons/core/utils/numbersUtils';
import { comparatorLike } from '../../../../../../commons/core/utils/string-utils';
import { BotonComponent } from '../../../../../../shared/components/boton/boton.component';
import { FormaPago } from '../../../../../financiero/forma-pago/forma-pago.model';
import { FormaPagoService } from '../../../../../financiero/forma-pago/forma-pago.service';
import { Moneda } from '../../../../../financiero/moneda/moneda.model';
import { MonedaService } from '../../../../../financiero/moneda/moneda.service';
import { Delivery } from '../../../../../operaciones/delivery/delivery.model';
import { PrecioDelivery } from '../../../../../operaciones/delivery/precio-delivery.model';
import { CobroDetalle } from '../../../../../operaciones/venta/cobro/cobro-detalle.model';
import { Cobro } from '../../../../../operaciones/venta/cobro/cobro.model';
import { DeliveryService } from '../../delivery-dialog/delivery.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatTab } from '@angular/material/tabs';
import { Cliente } from '../../../../../personas/clientes/cliente.model';
import { ClienteService } from '../../../../../personas/clientes/cliente.service';
import { DescuentoDialogData, DescuentoDialogComponent } from '../../pago-touch/descuento-dialog/descuento-dialog.component';
import { VentaService } from '../../../../../operaciones/venta/venta.service';
import { Venta } from '../../../../../operaciones/venta/venta.model';

export interface EditDeliveryDialogData {
  delivery: Delivery;
  monedaList?: Moneda[]
  cambioRs?: number;
  cambioDs?: number;
  formaPagoList?: FormaPago[];
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-edit-delivery-dialog',
  templateUrl: './edit-delivery-dialog.component.html',
  styleUrls: ['./edit-delivery-dialog.component.scss']
})
export class EditDeliveryDialogComponent implements OnInit, OnDestroy {

  @ViewChild("telefonoInput", { static: false }) telefonoInput: ElementRef;
  @ViewChild("precioInput", { static: false }) precioInput: ElementRef;
  @ViewChild("monedaInput", { static: false }) monedaInput: ElementRef;
  @ViewChild("monedaVueltoInput", { static: false }) monedaVueltoInput: ElementRef;
  @ViewChild("formaPagoInput", { static: false }) formaPagoInput: ElementRef;
  @ViewChild("vueltoInput", { static: false }) vueltoInput: ElementRef;
  @ViewChild("vueltoParaInput", { static: false }) vueltoParaInput: ElementRef;
  @ViewChild("direccionInput", { static: false }) direccionInput: ElementRef;
  @ViewChild("clienteInput", { static: false }) clienteInput: ElementRef;
  @ViewChild("guardarBtn", { read: BotonComponent }) guardarBtn: BotonComponent;

  selectedDelivery: Delivery;
  barrioControl = new FormControl()
  direccionControl = new FormControl()
  entregadorControl = new FormControl()
  precioControl = new FormControl(null)
  monedaControl = new FormControl(null)
  monedaVueltoControl = new FormControl(null)
  formaPagoControl = new FormControl(null)
  vueltoControl = new FormControl(null)
  vueltoParaControl = new FormControl(null)
  telefonoControl = new FormControl(null, [Validators.required, Validators.minLength(8)])
  vehiculoControl = new FormControl()
  clienteControl = new FormControl()
  saldoControl = new FormControl()
  isVueltoControl = new FormControl()

  //atributos para el autocomplete de precioDelivery
  precioList: PrecioDelivery[]
  filteredPrecioList: PrecioDelivery[]
  selectedPrecio: PrecioDelivery;
  precioSub: Subscription;
  precioTimer;

  //atributos para el autocomplete de moneda
  monedaList: Moneda[]
  filteredMonedaList: Moneda[]
  selectedMoneda: Moneda;
  monedaSub: Subscription;
  monedaTimer;

  //atributos para el autocomplete de persona
  clienteList: Cliente[]
  filteredClienteList: Cliente[]
  selectedCliente: Cliente;
  clienteSub: Subscription;
  clienteTimer;

  //atributos para el autocomplete de moneda
  monedaVueltoList: Moneda[]
  filteredMonedaVueltoList: Moneda[]
  selectedMonedaVuelto: Moneda;
  monedaVueltoSub: Subscription;
  monedaVueltoTimer;

  //atributos para el autocomplete de forma pago
  formaPagoList: FormaPago[]
  filteredFormaPagoList: FormaPago[]
  selectedFormaPago: FormaPago;
  formaPagoSub: Subscription;
  formaPagoTimer;

  // mascara para monedas
  currencyMask = new CurrencyMask();
  cambioRs = 1;
  cambioDs = 1;

  //vueltos segun las monedas
  vueltoGs = 0
  vueltoRs = 0
  vueltoDs = 0

  selectedVuelto = 0;

  totalVueltoPara = 0;
  totalVuelto = 0;

  //datasource para el vuelo
  cobroItemList: CobroDetalle[] = []
  isDescuento = false;
  isAumento = false;
  isVuelto = false;
  valorParcialPagado = 0

  /** Precios de delivery (#390): sin tarifa cargada no se cobra ni se guarda. */
  preciosFallo = false;
  sinTarifas = false;
  /** Una línea de cobro guardándose: un segundo Enter la duplicaría. */
  private guardandoCobro = false;
  /** Solo lo bajan la respuesta o el error: si el diálogo se cierra con la línea en vuelo, quedó sin confirmar. */
  private cobroSinRespuesta = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: EditDeliveryDialogData,
    private deliveryService: DeliveryService,
    private matDialogRef: MatDialogRef<EditDeliveryDialogComponent>,
    private clienteService: ClienteService,
    private matDialog: MatDialog,
    private ventaService: VentaService,
    private notificacionSnackbar: NotificacionSnackbarService,
  ) {
    
    this.selectedDelivery = data?.delivery;

    this.cambioRs = data?.cambioRs;
    this.cambioDs = data?.cambioDs;

    if (this.selectedDelivery?.venta?.valorTotal == null) {
      this.selectedDelivery.venta.valorTotal = 0;
      this.selectedDelivery?.venta?.ventaItemList?.forEach(vi => {
        this.selectedDelivery.venta.valorTotal += (vi.cantidad * (vi.precio - vi.valorDescuento))
      })
    }

    if (this.selectedDelivery?.id != null) {
      this.telefonoControl.setValue(this.selectedDelivery.telefono)
      this.direccionControl.setValue(this.selectedDelivery.direccion)
      this.selectedDelivery?.venta?.cliente != null ? this.onClienteSelect(this.selectedDelivery?.venta?.cliente) : null;
      this.selectedDelivery?.precio != null ? this.onPrecioSelect(this.selectedDelivery.precio) : null;
    }
  }

  ngOnInit(): void {
    this.cargarPrecios();

    this.precioSub = this.precioControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.precioControl.dirty) {
        if (res == "") this.selectedPrecio = null;
        if (this.precioTimer != null) {
          clearTimeout(this.precioTimer);
        }
        if (res != null && res.length != 0) {
          this.precioTimer = setTimeout(() => {
            this.filteredPrecioList = this.precioList.filter(p => p.id == res || comparatorLike(res, p.descripcion))
            if (this.filteredPrecioList.length == 1) {
              this.onPrecioSelect(this.filteredPrecioList[0]);
              this.onPrecioAutocompleteClose();
            } else {
              this.onPrecioAutocompleteClose();
              this.onPrecioSelect(null);
            }
          }, 500);
        } else {
          this.filteredPrecioList = [];
        }
      }
    });

    this.clienteSub = this.clienteControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.clienteControl.dirty) {
        if (res == "") this.selectedCliente = null;
        if (this.clienteTimer != null) {
          clearTimeout(this.clienteTimer);
        }
        if (res != null && res.length != 0) {
          this.clienteTimer = setTimeout(() => {
            this.clienteService.onSearch(res, true, PROPAGAR_ERROR_DE_RED).subscribe({ error: () => {
              this.notificacionSnackbar.openWarn('No se pudo buscar el cliente: el servidor no responde. Intentá de nuevo.', 4);
            }, next: clienteRes => {
              this.filteredClienteList = clienteRes ?? [];
              if (this.filteredClienteList.length == 1) {
                this.onClienteSelect(this.filteredClienteList[0]);
                this.onClienteAutocompleteClose();
              } else {
                this.onClienteAutocompleteClose();
                this.onClienteSelect(null);
              }
            } })
          }, 500);
        } else {
          this.filteredClienteList = [];
        }
      }
    });

    setTimeout(() => {
      this.monedaList = this.data?.monedaList ?? [];
      if (this.monedaList.length === 0 || !(this.data?.formaPagoList?.length > 0)) {
        this.notificacionSnackbar.openWarn('No se cargaron las monedas o formas de pago del POS: no se puede cobrar ni guardar el delivery.', 6);
      }
      this.onMonedaVueltoSelect(this.monedaList[0])
      setTimeout(() => {
        this.onMonedaSelect(this.monedaList[0])
        if (this.selectedDelivery?.id != null) {
          this.data.delivery.venta.cobro.cobroDetalleList.forEach(c => {
            this.isDescuento = c.descuento;
            this.isAumento = c.aumento;
            this.selectedFormaPago = c.formaPago
            this.selectedMoneda = c.moneda
            this.vueltoControl.setValue(c.valor)
            this.addCobroDetalle(null, c);
          })
        }
      }, 500);
    }, 0);

    setTimeout(() => {
      this.formaPagoList = this.data?.formaPagoList ?? [];
      this.onFormaPagoSelect(this.formaPagoList[0])
    }, 0);

    this.monedaSub = this.monedaControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.monedaControl.dirty) {
        if (res == "") this.selectedMoneda = null;
        if (this.monedaTimer != null) {
          clearTimeout(this.monedaTimer);
        }
        if (res != null && res.length != 0) {
          this.monedaTimer = setTimeout(() => {
            this.filteredMonedaList = this.monedaList.filter(p => p.id == res || comparatorLike(res, p.denominacion))
            if (this.filteredMonedaList.length == 1) {
              this.onMonedaSelect(this.filteredMonedaList[0]);
              this.onMonedaAutocompleteClose();
            } else {
              this.onMonedaAutocompleteClose();
              this.onMonedaSelect(null);
            }
          }, 500);
        } else {
          this.filteredMonedaList = [];
        }
      }
    });

    this.monedaVueltoSub = this.monedaVueltoControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.monedaVueltoControl.dirty) {
        if (res == "") this.selectedMonedaVuelto = null;
        if (this.monedaVueltoTimer != null) {
          clearTimeout(this.monedaVueltoTimer);
        }
        if (res != null && res.length != 0) {
          this.monedaVueltoTimer = setTimeout(() => {
            this.filteredMonedaVueltoList = this.monedaList.filter(p => p.id == res || comparatorLike(res, p.denominacion))
            if (this.filteredMonedaVueltoList.length == 1) {
              this.onMonedaVueltoSelect(this.filteredMonedaVueltoList[0]);
              this.onMonedaVueltoAutocompleteClose();
            } else {
              this.onMonedaVueltoAutocompleteClose();
              this.onMonedaVueltoSelect(null);
            }
          }, 500);
        } else {
          this.filteredMonedaVueltoList = [];
        }
      }
    });

    this.formaPagoSub = this.formaPagoControl.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (this.formaPagoControl.dirty) {
        if (res == "") this.selectedFormaPago = null;
        if (this.formaPagoTimer != null) {
          clearTimeout(this.formaPagoTimer);
        }
        if (res != null && res.length != 0) {
          this.formaPagoTimer = setTimeout(() => {
            this.filteredFormaPagoList = this.formaPagoList.filter(p => p.id == res || comparatorLike(res, p.descripcion))
            if (this.filteredFormaPagoList.length == 1) {
              this.onFormaPagoSelect(this.filteredFormaPagoList[0]);
              this.onFormaPagoAutocompleteClose();
            } else {
              this.onFormaPagoAutocompleteClose();
              this.onFormaPagoSelect(null);
            }
          }, 500);
        } else {
          this.filteredFormaPagoList = [];
        }
      }
    });

  }

  cargarDatos() {
    this.barrioControl = null
    this.direccionControl = null
    this.entregadorControl = null
    this.precioControl = null
    this.monedaControl = null
    this.formaPagoControl = null
    this.telefonoControl = null
    this.vehiculoControl = null
  }

  onPrecioAutocompleteClose() {
    setTimeout(() => {
      this.precioInput.nativeElement.select();
    }, 100);
  }

  /**
   * Antes, si los precios no cargaban, el delivery se podía guardar sin tarifa de envío y cobrar daba error. Un
   * delivery ya guardado con su tarifa la conserva aunque la consulta falle (#390).
   */
  private cargarPrecios(): void {
    this.preciosFallo = false;
    this.sinTarifas = false;
    this.deliveryService.onGetPreciosDelivery(false).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        if (res == null) {
          this.marcarPreciosFallidos(); // error GraphQL: el servicio ya avisó «Ups»
          return;
        }
        this.precioList = res;
        if (this.precioList.length > 0) {
          if(this.selectedPrecio==null) this.onPrecioSelect(this.precioList[0])
          this.vueltoControl.setValue(this.selectedDelivery.venta.valorTotal + this.selectedPrecio?.valor)
          this.saldoControl.setValue(this.selectedDelivery.venta.valorTotal + this.selectedPrecio?.valor)
          this.calcularVueltoPara()
          // this.calcularVuelto()
        } else if (this.selectedPrecio == null) {
          this.sinTarifas = true;
          this.notificacionSnackbar.openWarn('No hay tarifas de delivery configuradas: no se puede cobrar ni guardar el delivery.', 6);
        }
      },
      error: () => {
        this.marcarPreciosFallidos();
        if (this.selectedPrecio == null) {
          this.notificacionSnackbar.openWarn('No se pudieron cargar las tarifas de delivery: usá «Reintentar» antes de cobrar o guardar.', 6);
        }
      }
    });
  }

  private marcarPreciosFallidos(): void {
    this.preciosFallo = this.selectedPrecio == null;
  }

  reintentarPrecios(): void {
    this.cargarPrecios();
  }

  /**
   * Bloqueo de cobrar y guardar (#390): sin tarifa el saldo no se puede calcular y el delivery se guardaría sin
   * ella; con un cobro sin confirmar, cobrar o guardar de nuevo podría duplicarlo.
   */
  private bloqueaCobroYGuardado(): boolean {
    if (!(this.monedaList?.length > 0) || !(this.formaPagoList?.length > 0)) {
      // El POS no cargó monedas o formas de pago: cobrar daba error o calculaba con cotización nula (#390)
      this.notificacionSnackbar.openWarn('No se cargaron las monedas o formas de pago del POS: cerrá el delivery y reintentá.', 6);
      return true;
    }
    if (this.selectedDelivery?.cobroIncierto) {
      this.notificacionSnackbar.openWarn('Un cobro de este delivery quedó sin confirmar: abrilo de nuevo desde la lista para verificarlo.', 6);
      return true;
    }
    if (this.selectedPrecio == null) {
      this.notificacionSnackbar.openWarn(this.sinTarifas
        ? 'No hay tarifas de delivery configuradas: no se puede cobrar ni guardar el delivery.'
        : 'Falta la tarifa de delivery: usá «Reintentar» antes de cobrar o guardar.', 6);
      return true;
    }
    return false;
  }

  onPrecioSelect(e) {
    if (e?.id != null) {
      this.selectedPrecio = e;
      this.precioControl.setValue(
        this.selectedPrecio?.id + " - " + this.selectedPrecio?.descripcion + " - " + this.selectedPrecio?.valor
      );
    }
    this.calcularVueltoPara()
    // this.calcularVuelto()
  }

  onClienteAutocompleteClose() {
    setTimeout(() => {
      this.clienteInput.nativeElement.select();
    }, 100);
  }

  onClienteSelect(e) {
    if (e?.id != null) {
      this.selectedCliente = e;
      this.clienteControl.setValue(
        this.selectedCliente?.persona?.id + " - " + this.selectedCliente?.persona?.nombre
      );
    }
  }

  onMonedaAutocompleteClose() {
    setTimeout(() => {
      this.monedaInput.nativeElement.select();
    }, 100);
  }

  onMonedaSelect(e) {
    let valorEnGs = this.vueltoControl.value * this.selectedMoneda?.cambio;
    if (e?.id != null) {
      this.selectedMoneda = e;
      this.monedaControl.setValue(
        this.selectedMoneda?.id + " - " + this.selectedMoneda?.denominacion
      );
      this.vueltoControl.setValue(valorEnGs / this.selectedMoneda?.cambio)
    }
    this.calcularVueltoPara()
    // this.calcularVuelto()
  }

  onMonedaVueltoAutocompleteClose() {
    setTimeout(() => {
      this.monedaVueltoInput.nativeElement.select();
    }, 100);
  }

  onMonedaVueltoSelect(e) {
    if (e?.id != null) {
      this.selectedMonedaVuelto = e;
      this.monedaVueltoControl.setValue(
        this.selectedMonedaVuelto?.id + " - " + this.selectedMonedaVuelto?.denominacion
      );
    }
    this.calcularVuelto()
  }

  onFormaPagoAutocompleteClose() {
    setTimeout(() => {
      this.formaPagoInput.nativeElement.select();
    }, 100);
  }

  onFormaPagoSelect(e) {
    if (e?.id != null) {
      this.selectedFormaPago = e;
      this.formaPagoControl.setValue(
        this.selectedFormaPago?.id + " - " + this.selectedFormaPago?.descripcion
      );
      switch (this.selectedFormaPago.descripcion) {
        case 'EFECTIVO':
          this.vueltoControl.enable()
          break;
        case 'TARJETA':
          this.vueltoControl.enable()
          this.vueltoControl.setValue(this.saldoControl.value)
          break;
        case 'CONVENIO':
          this.vueltoControl.disable()
          break;

        default:
          break;
      }
    }
    // this.calcularVueltoPara()
    // this.calcularVuelto()
  }

  onDireccionEnter() {
    this.precioInput.nativeElement.select()
  }

  onPrecioEnter() {
    this.formaPagoInput.nativeElement.select()
  }

  onFormaPagoEnter() {
    this.monedaInput.nativeElement.select()
  }

  onMonedaEnter() {
    this.vueltoInput.nativeElement.select()
  }

  onMonedaVueltoEnter() {
    this.vueltoInput.nativeElement.select()
    this.calcularVuelto()
  }

  // onVueltoParaEnter() {
  //   if (this.isCustomVueltoPara) {
  //     let item = new CobroDetalle;
  //     item.aumento = false;
  //     item.descuento = false;
  //     item.pago = true;
  //     item.formaPago = this.selectedFormaPago;
  //     item.moneda = this.selectedMoneda;
  //     item.valor = this.vueltoParaControl.value;
  //     this.vueltoParaList.push(item)
  //     this.calcularVuelto()
  //   } else {
  //     this.monedaVueltoInput.nativeElement.select()
  //     this.calcularVuelto()
  //   }
  // }

  onVueltoEnter() {
    this.telefonoInput.nativeElement.select()
  }

  onTelefonoEnter() {
    this.clienteInput.nativeElement.select()
  }

  onClienteEnter() {
    this.guardarBtn.onGetFocus()
  }

  onCancelar() {
    this.matDialogRef.close(null)
  }

  onVueltoKeyup(key) {
    switch (key) {
      case '-':
        let value = this.vueltoControl.value;
        if (value == 0) value = 1;
        this.vueltoControl.setValue(value * -1)
        break;

      default:
        break;
    }
  }

  addCobroDetalle(selectedValor?: number, selectedItem?: CobroDetalle) {
    const esLineaNueva = selectedItem?.id == null;
    if (this.selectedPrecio == null) {
      // Sin tarifa no se puede calcular el saldo (antes TypeError); una línea nueva además avisa
      if (esLineaNueva) this.bloqueaCobroYGuardado();
      return;
    }
    if (esLineaNueva && (this.guardandoCobro || this.bloqueaCobroYGuardado())) {
      return;
    }
    // Para revertir si la línea no se registra (antes quedaba sumada al saldo sin guardarse) (#390)
    const previo = {
      valorParcialPagado: this.valorParcialPagado,
      vuelto: this.vueltoControl.value,
      saldo: this.saldoControl.value,
      isVuelto: this.isVuelto,
      isDescuento: this.isDescuento,
      isAumento: this.isAumento,
      moneda: this.selectedMoneda,
      formaPago: this.selectedFormaPago,
    };
    let valor = selectedValor != null ? selectedValor : this.vueltoControl.value;
    let saldo = this.saldoControl.value;
    if (saldo == 0) {
      return this.telefonoInput.nativeElement.select()
    }
    if (this.isDescuento) {
      valor = ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) - this.valorParcialPagado);
      this.selectedMoneda = this.monedaList.find(m => m.denominacion == 'GUARANI');
    }
    if (valor < 0) this.isVuelto = true;
    if (this.selectedFormaPago.descripcion == 'TARJETA' && (this.isVuelto || this.isDescuento || this.isAumento)) {
      this.selectedFormaPago = this.formaPagoList.find(f => f.descripcion == 'EFECTIVO');
    }
    if (this.vueltoControl.valid && saldo != 0) {
      let item = new CobroDetalle;
      if (selectedItem != null) Object.assign(item, selectedItem);
      item.formaPago = this.selectedFormaPago
      item.moneda = this.selectedMoneda
      item.valor = valor
      item.vuelto = this.isVuelto
      item.descuento = this.isDescuento
      item.aumento = this.isAumento
      item.pago = (!this.isVuelto && !this.isDescuento && !this.isAumento)
      // Una línea ya guardada (replay al reabrir) usa la cotización con la que se cobró si su
      // moneda hoy no tiene cotización: con la actual en null la línea sumaba 0 al saldo.
      const cambio = this.selectedMoneda?.cambio || (selectedItem?.id != null ? selectedItem?.cambio : null)
      if (!cambio && esLineaNueva) {
        // Igual que pago-touch: una línea nueva en una moneda sin cotización sumaba valor * null (#390)
        this.notificacionSnackbar.openWarn(`No hay cotización cargada para ${this.selectedMoneda?.denominacion || 'la moneda seleccionada'}: no se puede registrar el cobro en esa moneda.`, 5);
        this.isVuelto = previo.isVuelto;
        this.isDescuento = previo.isDescuento;
        this.isAumento = previo.isAumento;
        this.selectedMoneda = previo.moneda;
        this.selectedFormaPago = previo.formaPago;
        return;
      }
      item.cambio = cambio
      this.valorParcialPagado += item.valor * cambio;
      this.vueltoControl
        .setValue((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor - this.valorParcialPagado) / cambio);
      this.saldoControl.setValue(
        ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) - this.valorParcialPagado)
      );
      if (this.selectedDelivery?.id != null && item?.id == null) {
        item.cobro = this.selectedDelivery?.venta?.cobro
        this.guardandoCobro = true;
        this.cobroSinRespuesta = true;
        this.ventaService.onSaveCobroDetalle(item.toInput(), false)
          .pipe(finalize(() => (this.guardandoCobro = false)), untilDestroyed(this))
          .subscribe({ error: (err) => {
            this.cobroSinRespuesta = false;
            this.cobroNoRegistrado(err, previo);
          }, next: cbRes => {
          this.cobroSinRespuesta = false;
          if (cbRes != null) {
            item.id = cbRes.id;
            this.cobroItemList.push(item);
            this.isVuelto = false;
            this.isDescuento = false;
            this.isAumento = false;
            this.formaPagoControl.reset()
            this.monedaControl.reset()
            this.onFormaPagoSelect(this.formaPagoList[0])
            this.onMonedaSelect(this.monedaList[0])
            if (this.vueltoControl.value == 0) {
              this.telefonoInput.nativeElement.focus()
              this.isVueltoControl.setValue(false)
            } else if (this.vueltoControl.value < 0) {
              this.isVueltoControl.setValue(true)
              this.formaPagoInput.nativeElement.focus()
              if ((this.vueltoControl.value) <= ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) * 0.2)) {
                this.isAumento = true
              }
            } else {
              this.isVueltoControl.setValue(false)
              this.formaPagoInput.nativeElement.focus()
              if ((this.vueltoControl.value) <= ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) * 0.2)) {
                this.isDescuento = true
              }
            }
          } else {
            this.cobroNoRegistrado([], previo);
          }
        } })
      } else {
        this.cobroItemList.push(item);
        this.isVuelto = false;
        this.isDescuento = false;
        this.isAumento = false;
        this.formaPagoControl.reset()
        this.monedaControl.reset()
        this.onFormaPagoSelect(this.formaPagoList[0])
        this.onMonedaSelect(this.monedaList[0])
        if (this.vueltoControl.value == 0) {
          this.telefonoInput.nativeElement.focus()
          this.isVueltoControl.setValue(false)
        } else if (this.vueltoControl.value < 0) {
          this.isVueltoControl.setValue(true)
          this.formaPagoInput.nativeElement.focus()
          if ((this.vueltoControl.value) <= ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) * 0.2)) {
            this.isAumento = true
          }
        } else {
          this.isVueltoControl.setValue(false)
          this.formaPagoInput.nativeElement.focus()
          if ((this.vueltoControl.value) <= ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) * 0.2)) {
            this.isDescuento = true
          }
        }
      }


    }

  }

  /**
   * La línea no quedó registrada: se devuelve el saldo a como estaba. Un error de negocio (array) no se aplicó y
   * se puede reintentar; un error de red o un corte pudo haberse guardado igual en el filial, así que el delivery
   * queda marcado y no se cobra ni se guarda hasta volver a leerlo de la lista (#390).
   */
  private cobroNoRegistrado(err: any, previo: {
    valorParcialPagado: number; vuelto: any; saldo: any; isVuelto: boolean; isDescuento: boolean; isAumento: boolean;
    moneda: Moneda; formaPago: FormaPago;
  }): void {
    this.valorParcialPagado = previo.valorParcialPagado;
    this.vueltoControl.setValue(previo.vuelto);
    this.saldoControl.setValue(previo.saldo);
    this.isVuelto = previo.isVuelto;
    this.isDescuento = previo.isDescuento;
    this.isAumento = previo.isAumento;
    this.selectedMoneda = previo.moneda;
    this.selectedFormaPago = previo.formaPago;
    if (Array.isArray(err)) {
      this.notificacionSnackbar.openWarn('No se pudo registrar el cobro: reintentá.', 5);
      return;
    }
    if (this.selectedDelivery) {
      this.selectedDelivery.cobroIncierto = true;
    }
    this.notificacionSnackbar.openWarn('No se pudo confirmar el cobro: cerrá y abrí el delivery de nuevo desde la lista antes de seguir.', 8);
  }

  onDeleteItem(item: CobroDetalle, i) {
    if (this.selectedPrecio == null || this.selectedDelivery?.cobroIncierto) {
      this.bloqueaCobroYGuardado();
      return;
    }
    // Vuelto en la moneda elegida; si no tiene cotización, la de la línea (antes dividía por null)
    const cambioVuelto = this.selectedMoneda?.cambio || item.cambio || 1;
    if (item?.id != null) {
      this.ventaService.onDeleteCobroDetalle(item.id, item.sucursalId, false).subscribe(res => {
        if (res) {
          this.valorParcialPagado -= item.valor * item.cambio;

          this.saldoControl.setValue(
            ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) - this.valorParcialPagado)
          );
          this.vueltoControl.setValue(
            ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) - this.valorParcialPagado) / cambioVuelto
          );
          this.cobroItemList.splice(i, 1);
          this.formaPagoInput.nativeElement.select()
          if (this.vueltoControl.value == 0) {
            this.telefonoInput.nativeElement.focus()
            this.isVueltoControl.setValue(false)
          } else if (this.vueltoControl.value < 0) {
            this.isVueltoControl.setValue(true)
            this.formaPagoInput.nativeElement.focus()
          } else {
            this.isVueltoControl.setValue(false)
            this.formaPagoInput.nativeElement.focus()
          }
          this.calcularVueltoPara()
        }
      })
    } else {
      this.valorParcialPagado -= item.valor * item.cambio;

      this.saldoControl.setValue(
        ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) - this.valorParcialPagado)
      );
      this.vueltoControl.setValue(
        ((this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor) - this.valorParcialPagado) / cambioVuelto
      );
      this.cobroItemList.splice(i, 1);
      this.formaPagoInput.nativeElement.select()
      if (this.vueltoControl.value == 0) {
        this.telefonoInput.nativeElement.focus()
        this.isVueltoControl.setValue(false)
      } else if (this.vueltoControl.value < 0) {
        this.isVueltoControl.setValue(true)
        this.formaPagoInput.nativeElement.focus()
      } else {
        this.isVueltoControl.setValue(false)
        this.formaPagoInput.nativeElement.focus()
      }
      this.calcularVueltoPara()
    }

  }

  /** Un segundo «Guardar» con uno en vuelo duplicaría el delivery y su venta (#390). */
  private guardando = false;

  onGuardar() {
    if (this.guardando || this.guardandoCobro) return;
    if (this.bloqueaCobroYGuardado()) return;
    if (this.telefonoControl.valid) {
      let delivery = new Delivery()
      let venta = new Venta()
      let cobro = new Cobro()
      if (this.data.delivery != null) Object.assign(delivery, this.data?.delivery)
      if (delivery?.venta != null) Object.assign(venta, delivery.venta)
      if (venta?.cobro != null) Object.assign(cobro, venta.cobro)
      delivery.telefono = this.telefonoControl.value;
      delivery.precio = this.selectedPrecio;
      delivery.direccion = this.direccionControl.value;
      venta.cliente = this.selectedCliente;

      if (delivery?.venta?.cobro == null) {
        cobro = new Cobro()
        cobro.cobroDetalleList = this.cobroItemList;
      }

      this.guardando = true;
      // 60 s y no menos: un guardado lento que termina después del corte es justo el que se duplica.
      this.deliveryService.onSaveDeliveryAndVenta(delivery.toInput(), venta?.toInput(), venta?.toItemInputList(), cobro?.toInput(), cobro?.toItemInputList(), false,
        PROPAGAR_ERROR_DE_RED, { timeoutMs: TIMEOUT_POR_DEFECTO_MS })
        .pipe(finalize(() => (this.guardando = false)))
        .subscribe({
          next: (res) => {
            if (res != null) {
              delivery.id = res.id;
              delivery.venta = res.venta;
              delivery.creadoEn = res.creadoEn;
              this.matDialogRef.close({ delivery })
            } else {
              // Error del servidor (llega como null): antes el diálogo quedaba abierto sin decir nada.
              this.notificacionSnackbar.openWarn('No se pudo guardar el delivery.', 4);
            }
          },
          error: (err) => {
            // En el timeout ya avisa el link ("pudo haberse aplicado. Verificá antes de reintentar").
            if (esTimeoutDeLink(err)) return;
            // Un corte de red puede llegar después de que el filial guardó: no se promete que no se guardó.
            this.notificacionSnackbar.openWarn('No se pudo confirmar el guardado del delivery: revisá la lista antes de reintentar.', 4);
          },
        })
    }
  }

  calcularVueltoPara() {
    if (this.selectedPrecio == null) return; // sin tarifa no hay total (antes TypeError)
    let total = this.selectedDelivery?.venta.valorTotal + this.selectedPrecio.valor - this.valorParcialPagado;
    let valor = this.vueltoParaControl.value;
    if (this.cobroItemList?.length == 0) {
      let factorGs = Math.floor(total / 100000) + 1;
      this.selectedVuelto = 0;
      this.vueltoGs = factorGs * 100000
      // Sin cotización queda null (dividir por null da Infinity).
      this.vueltoRs = this.cambioRs ? (Math.floor((total / this.cambioRs) / 100) + 1) * 100 : null
      this.vueltoDs = this.cambioDs ? (Math.floor((total / this.cambioDs) / 100) + 1) * 100 : null
      if (this.selectedMoneda?.denominacion == 'GUARANI') {
        this.vueltoControl.setValue(this.vueltoGs)
      } else if (this.selectedMoneda?.denominacion == 'REAL') {
        this.vueltoControl.setValue(this.vueltoRs)
      } else if (this.selectedMoneda?.denominacion == 'DOLAR') {
        this.vueltoControl.setValue(this.vueltoDs)
      }
    }
  }

  calcularVuelto() {
    this.vueltoControl.setValue(((this.vueltoParaControl.value * this.selectedMoneda?.cambio) - (this.selectedDelivery?.venta?.valorTotal + this.selectedPrecio?.valor)) / this.selectedMonedaVuelto?.cambio);
    if (this.vueltoControl.value == 0) {
      this.telefonoInput.nativeElement.select()
    } else if (this.vueltoControl.value < 0) {
      this.vueltoParaControl.setValue(((this.vueltoControl.value * -1) * this.selectedMonedaVuelto.cambio) / this.selectedMoneda.cambio)
      this.formaPagoInput.nativeElement.select()
    }
  }

  onDescuento() {
    // let valor =
    //   this.formGroup.controls.valor.value * this.selectedMoneda.cambio;
    // if (valor < this.data.valor * 0.8 && valor > 0) {
    //   this.isDescuento = true;
    //   this.isVuelto = false;
    //   this.isAumento = false;
    //   this.addCobroDetalle();
    // }
    if (this.bloqueaCobroYGuardado()) return;
    let total = this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor;
    let saldo = this.saldoControl.value;

    let data: DescuentoDialogData = {
      valorTotal: total,
      cambioDs: this.cambioDs,
      cambioRs: this.cambioRs,
      saldo: saldo
    }
    this.matDialog.open(DescuentoDialogComponent, {
      data: data
    }).afterClosed().subscribe(res => {
      if (res > 0) {
        let valor = res;
        if (valor < (total * 0.25)) {
          this.isAumento = false;
          this.isVuelto = false;
          this.isDescuento = true;
          this.vueltoControl.setValue(valor)
          this.addCobroDetalle();
        }
      }
    })
  }

  onAumento() {
    if (this.bloqueaCobroYGuardado()) return;
    let total = this.selectedDelivery.venta.valorTotal + this.selectedPrecio.valor;
    let valor =
      this.vueltoControl.value;
    if (valor < total * 0.5 && valor < 0) {
      this.isAumento = true;
      this.isVuelto = false;
      this.isDescuento = false;
      this.addCobroDetalle();
    }
  }

  ngOnDestroy(): void {
    if (this.cobroSinRespuesta && this.selectedDelivery) {
      this.selectedDelivery.cobroIncierto = true;
    }
    this.precioSub.unsubscribe()
    this.monedaSub.unsubscribe()
  }

}
