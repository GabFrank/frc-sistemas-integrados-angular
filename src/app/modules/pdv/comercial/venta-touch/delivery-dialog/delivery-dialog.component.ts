import { Clipboard } from "@angular/cdk/clipboard";
import {
  AfterViewInit,
  Component,
  ElementRef, Inject, OnDestroy, OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { Subscription } from 'rxjs';
import { updateDataSourceWithId } from "../../../../../commons/core/utils/numbersUtils";
import { comparatorLike } from "../../../../../commons/core/utils/string-utils";
import { Tab } from "../../../../../layouts/tab/tab.model";
import { TabService } from "../../../../../layouts/tab/tab.service";
import { MainService } from '../../../../../main.service';
import { Moneda } from '../../../../../modules/financiero/moneda/moneda.model';
import { Barrio } from '../../../../../modules/general/barrio/barrio.model';
import { Delivery } from '../../../../../modules/operaciones/delivery/delivery.model';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { BotonComponent } from '../../../../../shared/components/boton/boton.component';
import { CargandoDialogService } from '../../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { FormaPago } from '../../../../financiero/forma-pago/forma-pago.model';
import { FormaPagoService } from '../../../../financiero/forma-pago/forma-pago.service';
import { MonedaService } from '../../../../financiero/moneda/moneda.service';
import { BarrioService } from '../../../../general/barrio/barrio.service';
import { DeliveryEstado } from '../../../../operaciones/delivery/enums';
import { PrecioDelivery } from '../../../../operaciones/delivery/precio-delivery.model';
import { Venta } from "../../../../operaciones/venta/venta.model";
import { VueltoItem } from "../../../../operaciones/vuelto/vuelto-item/vuelto-item.model";
import { Vuelto } from "../../../../operaciones/vuelto/vuelto.model";
import { VueltoService } from "../../../../operaciones/vuelto/vuelto.service";
import { Cliente } from '../../../../personas/clientes/cliente.model';
import { ClienteService } from '../../../../personas/clientes/cliente.service';
import { DeliveryPresupuestoDialogComponent } from "../delivery-presupuesto-dialog/delivery-presupuesto-dialog.component";
import { VentaTouchComponent } from "../venta-touch.component";
import { DeliveryService } from './delivery.service';

export class DeliveryData {
  cambioRs: number
  cambioDs: number
  cambioArg: number
}

export class DeliveryResponseData {
  delivery: Delivery;
  finalizado: boolean;
  modificar: boolean;
  cancelar: boolean;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-delivery-dialog',
  templateUrl: './delivery-dialog.component.html',
  styleUrls: ['./delivery-dialog.component.css'],
})
export class DeliveryDialogComponent implements OnInit, OnDestroy, AfterViewInit {

  readonly DeliveryEstado = DeliveryEstado
  @ViewChild('container', { read: ElementRef }) container: ElementRef;
  @ViewChild('child', { read: HTMLElement }) child: HTMLElement;
  @ViewChild('matPrefixSelect', { static: false }) matPrefixSelect: MatSelect;
  @ViewChild('telefonoInput', { static: false }) telefonoInput: ElementRef;
  @ViewChild('valorInput', { static: false }) valorInput: ElementRef;
  @ViewChild('direccionInput', { static: false }) direccionInput: ElementRef;
  @ViewChild('barrioInput', { static: false }) barrioInput: ElementRef;
  @ViewChild('barrioSelect', { static: false }) barrioSelect: MatSelect;
  @ViewChildren('preciosList') preciosListBtn: QueryList<BotonComponent>;
  @ViewChild('barrioFilterInput', { static: false }) barrioFilterInput: ElementRef;
  @ViewChildren('formaPagoBtnList') formaPagoBtnList: QueryList<BotonComponent>;
  @ViewChildren('monedasBtnList') monedasBtnList: QueryList<BotonComponent>;
  @ViewChildren('vueltoBtnList') vueltoBtnList: QueryList<BotonComponent>;
  @ViewChild('finalizarBtn', { read: BotonComponent }) finalizarBtn: BotonComponent;

  @ViewChild("clienteInput", { static: false })
  clienteInput: ElementRef;
  clienteControl = new FormControl();

  clienteList: Cliente[];

  clienteSub: Subscription;
  barrioSub: Subscription;

  clienteTimer;
  barrioTimer;

  horaActualTimer;

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

  totalGs = 0;
  totalConDelivery = 0;
  cambioRs = 0;
  cambioDs = 0;
  cambioArg = 0;
  selectedVueltoList = []

  selectedDelivery: Delivery;
  selectedVenta: Venta = new Venta;
  selectedVuelto: Vuelto = new Vuelto;
  selectedBarrio: Barrio;
  formGroup: FormGroup;
  telefonoControl = new FormControl(null, [Validators.required, Validators.minLength(4)])
  telefonoPrefixControl = new FormControl()
  direccionControl = new FormControl()
  barrioControl = new FormControl()
  entregadorControl = new FormControl()
  estadoControl = new FormControl()
  precioControl = new FormControl()
  ventaControl = new FormControl()
  formaPagoControl = new FormControl()
  barrioFilterControl = new FormControl()
  barrioList: Barrio[] = []
  filteredBarriosList: Barrio[] = []
  precioDeliveryList: PrecioDelivery[] = []
  formaPagoList: FormaPago[] = []
  monedaList: Moneda[] = []
  monedaControl = new FormControl()
  vueltoItemList: VueltoItem[] = []
  valorControl = new FormControl(0, [Validators.required, Validators.min(1)])
  vueltoControl = new FormControl(null)
  vueltoListGs: number[] = []
  vueltoListRs: number[] = []
  vueltoListDs: number[] = []
  saldoGs = 0;
  vueltoGs = 0;
  prefixList = ['+595', '+55']
  deliverActivoList: Delivery[] = []
  deliveryConcluidoList: Delivery[] = []
  selectedCliente: Cliente;

  loadingItens = 1;

  isDialogOpen = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: DeliveryData,
    private barrioService: BarrioService,
    private mainService: MainService,
    private deliveryService: DeliveryService,
    private formaPagoService: FormaPagoService,
    private monedaService: MonedaService,
    private cargandoService: CargandoDialogService,
    private copyToClipService: Clipboard,
    private notificacionService: NotificacionSnackbarService,
    private clienteService: ClienteService,
    private matDialog: MatDialog,
    private tabService: TabService,
    private matDialogRef: MatDialogRef<DeliveryDialogComponent>,
    private vueltoService: VueltoService
  ) {

    this.horaActualTimer = setInterval((value) => {
      this.actualizarHorarios(new Date())
    }, 1000);

    if (data != null) {
      this.cambioRs = data.cambioRs
      this.cambioDs = data.cambioDs
      this.cambioArg = data.cambioArg
    }

    this.totalConDelivery = this.totalGs;

    this.barrioService.onGetPorCiudadId(this.mainService?.sucursalActual?.ciudad?.id).subscribe(res => {
      this.barrioList = res;
      this.filteredBarriosList = res;
      this.loadingItens++;
    })

    this.monedaService.onGetAll().subscribe(res => {
      this.monedaList = res;
      this.cambioRs = this.monedaList.find(
        (m) => m.denominacion == "REAL"
      )?.cambio;
      this.cambioDs = this.monedaList.find(
        (m) => m.denominacion == "DOLAR"
      )?.cambio;
      this.cambioArg = this.monedaList.find(
        (m) => m.denominacion == "PESO ARG"
      )?.cambio;

      this.monedaControl.setValue(this.monedaList[0])
      this.deliveryService.onGetPreciosDelivery().subscribe(res => {
        setTimeout(() => {
          this.precioDeliveryList = res;
          this.precioControl.setValue(this.precioDeliveryList[0])
          this.totalConDelivery += this.precioControl.value?.valor;
          this.calcularVuelto()
        }, 5000);
        setTimeout(() => {
          this.vueltoControl.setValue(this.vueltoListGs[0])
          this.valorControl.setValue(this.vueltoControl.value)
          this.loadingItens++;
        }, 0);
      })
    })

    this.barrioFilterControl.valueChanges.subscribe(res => {
      this.filteredBarriosList = this.barrioList.filter(b => b.descripcion?.toUpperCase().includes(res?.toUpperCase()))
    })

    this.formaPagoService.onGetAllFormaPago().subscribe(res => {
      this.formaPagoList = res;
      this.formaPagoControl.setValue(this.formaPagoList[0])
      this.loadingItens++;
    })

  }

  ngOnInit(): void {

    this.createForm()
    this.telefonoPrefixControl.setValue(this.prefixList[0])
    setTimeout(() => {
    }, 1000);

    let time;
    time = setInterval(() => {
      if (this.loadingItens = 4) {
        this.telefonoInput.nativeElement.select()
        clearInterval(time)
      }
    }, 500);

    this.clienteList = [];

    this.clienteSub = this.clienteControl.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (res == "") this.selectedCliente = null;
        if (this.clienteTimer != null) {
          clearTimeout(this.clienteTimer);
        }
        if (res != null && res.length != 0) {
          this.clienteTimer = setTimeout(() => {
            this.clienteService
              .onSearch(res).pipe(untilDestroyed(this))
              .subscribe((response) => {
                this.clienteList = response;
                if (this.clienteList.length == 1) {
                  this.onClienteSelect(this.clienteList[0]);
                  this.onClienteAutocompleteClose();
                } else {
                  this.onClienteAutocompleteClose();
                  this.onClienteSelect(null);
                }
              });
          }, 500);
        } else {
          this.clienteList = [];
        }
      }
    );

    this.barrioSub = this.barrioControl.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (res == "") this.selectedBarrio = null;
        if (this.barrioTimer != null) {
          clearTimeout(this.barrioTimer);
        }
        if (res != null && res.length != 0) {
          this.barrioTimer = setTimeout(() => {
            this.filteredBarriosList = this.barrioList.filter(b => res == b.id || comparatorLike(res, b.descripcion) != null)
            if (this.filteredBarriosList.length == 1) {
              this.onBarrioSelect(this.filteredBarriosList[0]);
              this.onBarrioAutocompleteClose();
            } else {
              this.onBarrioAutocompleteClose();
              this.onBarrioSelect(null);
            }
          }, 500);
        } else {
          this.clienteList = [];
        }
      }
    );

    this.cargarDatos()
  }

  ngAfterViewInit(): void {
    this.child = this.container.nativeElement;
    this.tabService.tabSub.pipe(untilDestroyed(this)).subscribe(res => {
      setTimeout(() => {
        if (this.tabService.currentTab()?.title == 'Delivery') {
          this.telefonoInput.nativeElement.select()
        }
      }, 500);
    })

    this.container.nativeElement.addEventListener("keydown", (e) => {
      this.keyFunctions(e.key)
    });
  }

  keyFunctions(key) {
    if (!this.isDialogOpen) {
      switch (key) {
        case "F12":
          this.verificarTelefono()
          if (this.telefonoControl.valid) {
            this.onFinalizar()
          }
          break;
        case "F11":
          this.verificarTelefono()
          if (this.telefonoControl.valid) {
            this.onGuardar()
          }
          break;
        case "F10":
          this.goToVentas()
          break;
        case "F9":
          break;
        case "F8":
          if (this.valorControl.valid) {
            this.onAddItem();
          }
          break;
        case "F7":
          break;
        case "F6":
          break;
        case "F5":
          break;
        case "F4":
          break;
        case "F3":
          break;
        case "F2":
          break;
        case "F1":
          break;
        default:
          break;
      }
    }
  }

  cargarDatos() {
    this.onDeliverySelect(this.selectedDelivery)
    this.deliveryService.onGetDeliverysByEstadoList([DeliveryEstado.ABIERTO, DeliveryEstado.PARA_ENTREGA, DeliveryEstado.EN_CAMINO]).subscribe(res => {
      if (res != null) {
        this.deliverActivoList = res;
      }
    })
  }

  onDeliverySelect(deliverActivo) {
    if (deliverActivo?.venta?.id != null) {
      this.cargarDatosDelivery(deliverActivo)
    } else if (deliverActivo?.id != null) {
      this.deliveryService.onGetById(deliverActivo?.id).pipe(untilDestroyed(this)).subscribe(res => {
        if (res != null) {
          this.deliverActivoList = updateDataSourceWithId(this.deliverActivoList, res, deliverActivo.id)
          this.cargarDatosDelivery(res)
        }
      })
    }
  }

  cargarDatosDelivery(delivery: Delivery) {
    this.cargandoService.openDialog()
    this.selectedDelivery = new Delivery;
    this.selectedVenta = new Venta;
    this.selectedVuelto = new Vuelto;

    if (delivery?.venta?.cliente == null) {
      this.selectedCliente = null;
      this.clienteControl.setValue(null);
    } else {
      this.onClienteSelect(delivery?.venta?.cliente)
    }

    if (delivery?.barrio == null) {
      this.selectedBarrio = null;
      this.barrioControl.setValue(null);
    } else {
      this.onBarrioSelect(delivery?.barrio)
    }

    Object.assign(this.selectedDelivery, delivery)
    this.selectedDelivery?.venta != null ? Object.assign(this.selectedVenta, this.selectedDelivery?.venta) : null;
    this.selectedDelivery?.vuelto != null ? Object.assign(this.selectedVuelto, this.selectedDelivery?.vuelto) : null;
    this.copyToClip(this.selectedDelivery?.telefono)
    this.telefonoControl.setValue(this.selectedDelivery?.telefono)
    this.verificarTelefono()
    this.navigatePrecios(this.precioDeliveryList.findIndex(p => p.id == delivery?.precio?.id))
    if (this.selectedVuelto?.vueltoItemList?.length > 0) {
      this.selectedVuelto.vueltoItemList = delivery?.vuelto?.vueltoItemList;
    }
    this.calcularSaldo()
    setTimeout(() => {
      this.cargandoService.closeDialog()
      this.finalizarBtn.onGetFocus()
    }, 800);
  }

  calcularVuelto() {
    this.vueltoListGs = []
    this.vueltoListRs = []
    this.vueltoListDs = []
    let factorGs = Math.floor(this.totalConDelivery / 100000) + 1;
    let factorRs = Math.floor((this.totalConDelivery / this.cambioRs) / 100) + 1;
    let factorDs = Math.floor((this.totalConDelivery / this.cambioDs) / 100) + 1;
    this.vueltoListGs.push(factorGs * 100000);
    this.vueltoListRs.push(factorRs * 100);
    this.vueltoListDs.push(factorDs * 100);

    if (this.totalConDelivery < 50000) {
      this.vueltoListGs.push(50000)
    }
    if (this.totalConDelivery / this.cambioRs < 50) {
      this.vueltoListRs.push(50)
    }
    if (this.totalConDelivery / this.cambioDs < 50) {
      this.vueltoListDs.push(50)
    }

    this.vueltoListGs.push(this.totalConDelivery)

    this.vueltoListRs.push(this.totalConDelivery / this.cambioRs)

    this.vueltoListDs.push(this.totalConDelivery / this.cambioDs)


    if (this.monedaControl.value?.denominacion.includes('GUARANI')) {
      this.selectedVueltoList = this.vueltoListGs;
    }
    if (this.monedaControl.value?.denominacion.includes('REAL')) {
      this.selectedVueltoList = this.vueltoListRs;
    }
    if (this.monedaControl.value?.denominacion.includes('DOLAR')) {
      this.selectedVueltoList = this.vueltoListDs;
    }
  }

  createForm() {
    this.formGroup = new FormGroup({
      'telefonoControl': this.telefonoControl,
      'direccionControl': this.direccionControl,
      'barrioControl': this.barrioControl,
      'entregadorControl': this.entregadorControl,
      'estadoControl': this.estadoControl,
      'precioControl': this.precioControl,
      'ventaControl': this.ventaControl,
      'telefonoPrefixControl': this.telefonoPrefixControl
    })
  }

  onPrefixSelect() {
    setTimeout(() => {
      this.matPrefixSelect.close()
      this.telefonoInput.nativeElement.select()
    }, 100);
  }

  onTelefonoEnter() {
    this.clienteInput.nativeElement.select()
  }

  onClienteEnter() {
    this.direccionInput.nativeElement.select()
  }

  verificarTelefono() {
    if (this.telefonoControl.valid) {
      let telefono: string = this.telefonoControl.value;
      telefono = telefono.trim()
      if (telefono.includes('+595') || telefono.substring(0, 2).includes('595')) {
        this.telefonoPrefixControl.setValue(this.prefixList[0])
      }
      if (telefono.includes('+55') || telefono.substring(0, 1).includes('55')) {
        this.telefonoPrefixControl.setValue(this.prefixList[1])
      }
      if (telefono.includes('09')) {
        this.telefonoPrefixControl.setValue(this.prefixList[0])
      }
      telefono = telefono.replace(/\ /g, "");
      telefono = telefono.replace(/\-/g, "");
      telefono = telefono.replace(/\+55/g, "");
      telefono = telefono.replace(/\+595/g, "");
      if (telefono[0] == '0') {
        telefono = telefono.substring(1);
      }
      this.telefonoControl.setValue(telefono)
      this.copyToClip(this.telefonoPrefixControl.value + this.telefonoControl.value)
    }
  }

  onDireccionEnter() {
    this.barrioInput.nativeElement.focus()
  }

  navigatePrecios(index) {
    if (index < 0) index = this.precioDeliveryList.findIndex(p => p.id == this.precioControl.value?.precioDelivery?.id);
    if (index > this.preciosListBtn.length - 1) {
      index = index - 1;
    }
    setTimeout(() => {
      this.precioControl.setValue(this.precioDeliveryList[index])
      this.totalConDelivery = this.totalGs + this.precioControl?.value?.valor;
      this.calcularVuelto()
      this.preciosListBtn.toArray()[index].onGetFocus()
    }, 100);
  }

  onPrecioSelect() {
    let index = this.formaPagoList.findIndex(p => p.id == this.formaPagoControl.value?.id)
    if (index >= 0) {
      this.navigateFormaPago(index)
      this.calcularVuelto()
    }
  }

  onBarrioEnter() {
    this.barrioSelect.close()
    let index = this.precioDeliveryList.findIndex(p => p.id == this.barrioControl.value?.precioDelivery?.id)
    if (index != -1) {
      this.navigatePrecios(index)
    } else {
      index = this.precioDeliveryList.findIndex(p => p.id == this.precioControl.value?.id)
      this.navigatePrecios(0)
    }
  }

  navigateFormaPago(index) {
    if (index < 0) index = 0;
    if (index > this.formaPagoBtnList.length - 1) index = index - 1;
    setTimeout(() => {
      this.formaPagoControl.setValue(this.formaPagoList[index])
      this.formaPagoBtnList.toArray()[index].onGetFocus()
    }, 100);
  }

  onFormaPagoSelect() {
    this.navigateMoneda(0)
  }

  onFormaPagoKeyUp(key) {
    if (Number(key) == +key) {
      let index = this.formaPagoList.findIndex(f => f.id == +key);
      if (index != -1) {
        this.navigateFormaPago(index)
        this.navigateMoneda(0)
      }
    }
  }

  navigateMoneda(index) {
    if (index < 0) index = 0;
    if (index > this.monedasBtnList.length - 1) index = index - 1;
    setTimeout(() => {
      this.monedaControl.setValue(this.monedaList[index])
      this.monedasBtnList.toArray()[index].onGetFocus()
      this.calcularVuelto()
    }, 100);
  }

  onMonedaKeyUp(key) {
    if (Number(key) == +key) {
      let index = this.monedaList.findIndex(f => f.id == +key);
      if (index != -1) {
        this.navigateMoneda(index)
        this.navigateVuelto(0)
      }
    }
  }

  onMonedaSelect() {
    this.navigateVuelto(0)
  }

  navigateVuelto(index) {
    if (index < 0) index = 0;
    if (index > this.vueltoBtnList.length - 1) index = index - 1;
    setTimeout(() => {
      this.vueltoControl.setValue(this.selectedVueltoList[index])
      this.vueltoBtnList.toArray()[index].onGetFocus()
      this.valorControl.setValue(this.vueltoControl.value)
    }, 100);
  }

  onVueltoKeyUp(key) {
    if (Number(key) == +key) {
      let index = this.selectedVueltoList.findIndex(f => f.id == +key);
      if (index != -1) {
        this.navigateVuelto(index)
        this.onValorFocus()
      }
    }
  }

  onVueltoSelect() {
    this.onValorFocus()
  }

  onDeleteItem(item: VueltoItem, i) {
    if (item?.id) {
      this.vueltoService.onDeleteVueltoItem(item.id).pipe(untilDestroyed(this)).subscribe(res => {
        if (res) {
          this.selectedVuelto?.vueltoItemList?.splice(i, 1);
          this.calcularSaldo()
        }
      })
    } else {
      this.selectedVuelto?.vueltoItemList?.splice(i, 1);
      this.calcularSaldo()
    }

  }

  onValorEnter() {

  }

  onValorFocus() {
    this.valorInput.nativeElement.focus()
    setTimeout(() => {
      this.valorInput.nativeElement.select()
    }, 100);
  }

  onAddItem() {
    if (this.valorControl.valid) {
      let item = new VueltoItem();
      item.moneda = this.monedaControl.value;
      item.valor = this.valorControl.value;
      this.selectedVuelto?.vueltoItemList?.push(item)
      this.calcularSaldo()
    }
  }

  calcularSaldo() {
    this.saldoGs = 0;
    this.vueltoGs = 0;
    if (this.selectedVuelto?.vueltoItemList?.length > 0) {
      this.selectedVuelto?.vueltoItemList?.forEach(p => {
        this.saldoGs += (p.valor * p.moneda.cambio)
      })
      if (this.saldoGs > this.totalConDelivery) {
        this.vueltoGs = this.saldoGs - this.totalConDelivery;
        this.valorControl.setValue(0)

      } else if (this.saldoGs < this.totalConDelivery) {
        this.valorControl.setValue(this.totalConDelivery - this.saldoGs)
        this.navigateFormaPago(0)
        this.navigateMoneda(0)
        this.navigateVuelto(0)
        this.onValorFocus()
      } else if (this.saldoGs == this.totalConDelivery) {
        this.valorControl.setValue(0)
        setTimeout(() => {
          this.finalizarBtn.onGetFocus()
        }, 500);
      }
    } else {
      this.valorControl.setValue(this.vueltoControl.value)
      this.onValorFocus()
    }
  }

  onFinalizar() {

  }

  onGuardar() {
    let isNew = this.selectedDelivery?.id == null;
    if (isNew) this.selectedDelivery = new Delivery;
    this.selectedDelivery.barrio = this.barrioControl.value;
    this.selectedDelivery.direccion = this.direccionControl.value;
    this.selectedDelivery.estado = DeliveryEstado.ABIERTO;
    this.selectedDelivery.precio = this.precioControl.value;
    this.selectedDelivery.telefono = this.telefonoPrefixControl.value + this.telefonoControl.value;
    this.selectedDelivery.venta = this.selectedVenta;
    this.selectedDelivery.vuelto = this.selectedVuelto;

    // this.deliveryService.onSaveDeliveryAndVenta(this.selectedDelivery?.toInput(), this.selectedDelivery?.venta?.toInput(), this.selectedDelivery?.venta?.toItemInputList(), this.selectedDelivery?.vuelto?.toInput(), this.selectedDelivery?.vuelto?.toItemInputList()).subscribe(res => {
    //   if (res != null) {
    //     this.selectedDelivery = res;
    //     if (isNew) {
    //       this.deliverActivoList.push(res)
    //     } else {
    //       this.deliverActivoList = updateDataSourceWithId(this.deliverActivoList, res, res.id)
    //     }
    //   }
    // })
  }

  onSalir() {
    this.matDialogRef.close()
  }
  onPresupuesto() {
    this.matDialog.open(DeliveryPresupuestoDialogComponent, {
      data: {
        delivery: this.selectedDelivery,
        cambioRs: this.cambioRs,
        cambioDs: this.cambioDs,
        totalFinal: this.totalConDelivery
      },
      height: '900px'
    })
  }

  onFacturaLegal() {

  }
  onModificarItens() {
    this.isDialogOpen = true
    this.matDialog.open(VentaTouchComponent, {
      maxWidth: '90vw',
      height: '90vh',
      width: '90vw',
      data: {
        isDelivery: true,
        venta: this.selectedVenta
      }
    })
  }

  goToVentas() {
    this.tabService.addTab(new Tab(VentaTouchComponent, 'Venta', null, null));
  }

  copyToClip(text) {
    this.copyToClipService.copy(text);
    this.notificacionService.notification$.next({
      texto: `Copiado: ${text}`,
      color: NotificacionColor.success,
      duracion: 1,
    });
  }

  onDelete(deliverActivo, i) {

  }

  onClienteSearch() {

  }

  onClienteSelect(e) {
    if (e?.id != null) {
      this.selectedCliente = e;
      this.clienteControl.setValue(
        this.selectedCliente?.id +
        " - " +
        this.selectedCliente?.persona?.nombre
      );
    }
  }

  onBarrioSelect(e) {
    if (e?.id != null) {
      this.selectedBarrio = e;
      this.barrioControl.setValue(
        this.selectedBarrio?.id +
        " - " +
        this.selectedBarrio?.descripcion +
        " - " +
        this.selectedBarrio?.precioDelivery?.valor
      );
    }
  }

  onClienteAutocompleteClose() {
    setTimeout(() => {
      this.clienteInput.nativeElement.select();
    }, 100);
  }

  onBarrioAutocompleteClose() {
    setTimeout(() => {
      this.barrioInput.nativeElement.select();
    }, 100);
  }

  ngOnDestroy(): void {
    clearTimeout(this.horaActualTimer)
  }

  actualizarHorarios(newDate: Date) {
    // this.deliverActivoList.forEach(d => {
    //   let diff = newDate?.getTime() - d.creadoEn?.getTime();
    //   const seconds = Math.floor(diff / 1000 % 60);
    //   d.duracion = new Date(seconds * 1000).toISOString().slice(11, 19);
    // })
  }

  onNewDelivery() {
    this.selectedDelivery = null;
    this.selectedVenta = null;
    this.selectedVuelto = null;
    this.cargandoService.openDialog()
    this.onDeliverySelect(null)
    this.telefonoPrefixControl.setValue(this.prefixList[0])
    this.telefonoControl.setValue('')
    this.clienteControl.setValue(null)
    this.selectedCliente = null;
    this.barrioControl.setValue(null)
    this.selectedBarrio = null;
    this.direccionControl.setValue(null)
    this.navigatePrecios(0)
    this.navigateFormaPago(0)
    this.navigateMoneda(0)
    this.navigateVuelto(0)
    this.valorControl.setValue(null)
    this.calcularSaldo();
    setTimeout(() => {
      this.cargandoService.closeDialog()
      this.telefonoInput.nativeElement.focus()
    }, 500);
  }

  onBarrioSearch() {

  }
}


/*

Buenas, quetal? estoy necesitando cortes de acrilico blanco en las siguientes medidas:
2 unidades - 30cm x 45cm
4 unidades - 2cm x 41cm
4 unidades - 1.5cm x 41cm
4 unidades - 2cm x 30cm
Tambien necesito corte en mdf de 3mm
4 unidades - 10cm x 30cm
4 unidades - 10 x 45cm
2 unidades - 30 x 45 cm

Tambien necesito letras en adhesivos negro
2 unidades - frase: WIFI, tamanho: 15cm de ancho la frase entera y ancho proporcional
2 unidades - frase: DON FRANCO, tamanho: 38cm de ancho la frase entera y ancho proporcional
2 unidades - frase: buenacomida, tamanho: 40cm de ancho la frase entera y ancho proporcional
*/