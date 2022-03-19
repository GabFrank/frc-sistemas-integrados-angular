import { Clipboard } from '@angular/cdk/clipboard';
import {
  AfterContentChecked,
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { Observable } from 'rxjs';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { MonedasGetAllGQL } from '../../../../../modules/financiero/moneda/graphql/monedasGetAll';
import { Moneda } from '../../../../../modules/financiero/moneda/moneda.model';
import { Barrio } from '../../../../../modules/general/barrio/barrio.model';
import { BarriosPorCiudadIdGQL } from '../../../../../modules/general/barrio/graphql/barriosPorCiudadId';
import { Delivery } from '../../../../../modules/operaciones/delivery/delivery.model';
import { DeliveryEstado } from '../../../../../modules/operaciones/delivery/enums';
import { DeliveryInput } from '../../../../../modules/operaciones/delivery/graphql/delivery-input.model';
import { SaveDeliveryGQL } from '../../../../../modules/operaciones/delivery/graphql/saveDelivery';
import { PrecioDelivery } from '../../../../../modules/operaciones/delivery/precio-delivery.model';
import { PreciosDeliveryGQL } from '../../../../../modules/operaciones/delivery/precio-delivery/graphql/precioDeliverySearchByPrecio';
import { VueltoItemInput } from '../../../../../modules/operaciones/vuelto/vuelto-item/vuelto-item-input.model';
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from '../../../../../notificacion-snackbar.service';
import { DeliveryService } from '../delivery.service';
import {
  PagoTouchComponent,
} from '../pago-touch/pago-touch.component';
import { RedondeoDialogComponent } from '../redondeo-dialog/redondeo-dialog.component';
import {
  SeleccionarBilletesTouchComponent,
  SelectBilletesResponseData,
} from '../seleccionar-billetes-touch/seleccionar-billetes-touch.component';

export class DeliveryData {
  valor: number;
  monedas: Moneda[];
}

interface VueltoItem {
  valor: number;
  moneda: Moneda;
  formaPago: string;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-delivery-dialog',
  templateUrl: './delivery-dialog.component.html',
  styleUrls: ['./delivery-dialog.component.css'],
})
export class DeliveryDialogComponent implements OnInit, AfterContentChecked {
  @ViewChild('telefonoInput', { static: false }) telefonoInput: ElementRef;
  @ViewChild('nombreClienteInput', { static: false })
  nombreClienteInput: ElementRef;
  @ViewChild('direccionInput', { static: false }) direccionInput: ElementRef;
  @ViewChild('efectivoBtn', { static: false }) efectivoBtn: MatButton;
  @ViewChild('guaraniBtn', { static: false }) guaraniBtn: MatButton;
  @ViewChild('valorVueltoInput', { static: false })
  valorVueltoInput: ElementRef;
  @ViewChild('finalizarBtn', { static: false }) finalizarBtn: MatButton;
  @ViewChild('vueltoParaGsBtn', { static: false }) vueltoParaGsBtn: MatButton;
  @ViewChild('vueltoParaRsBtn', { static: false }) vueltoParaRsBtn: MatButton;
  @ViewChild('vueltoParaDsBtn', { static: false }) vueltoParaDsBtn: MatButton;
  @ViewChild('vueltoParaOtroBtn', { static: false })
  vueltoParaOtroBtn: MatButton;
  @ViewChild('monedaBtn', { static: false }) monedaBtn: MatButton;
  @ViewChild('formaPagoBtn', { static: false }) formaPagoBtn: MatButton;
  @ViewChild('precioDeliveryBtn', { static: false })
  precioDeliveryBtn: MatButton;
  @ViewChild('autoBarrioInput', { static: false }) autoBarrioInput: ElementRef;
  @ViewChild('paisTelefonoSelect', { static: false })
  paisTelefonoSelect: MatSelect;
  @ViewChild('autoBarrioInput', {
    static: false,
    read: MatAutocompleteTrigger,
  })
  matBarrioTrigger: MatAutocompleteTrigger;

  formGroup: FormGroup;
  selectedPrecio: FormControl = new FormControl();
  selectedPago = 'Efectivo';
  valorRs = 0;
  valorDs = 0;
  cambioRs = 0;
  cambioDs = 0;
  cambioPs = 0;
  deliveryGs = 0;
  deliveryRs = 0;
  deliveryDs = 0;
  monedas: Moneda[];
  filteredMonedas: Moneda[];
  selectedMoneda: Moneda;
  vueltoParaGs = 0;
  vueltoParaRs = 0;
  vueltoParaDs = 0;
  selectedVueltoPara = 0;
  barrios: Barrio[];
  filteredBarrios: Barrio[];
  selectedBarrio: Barrio;
  timer: any;
  precioDeliveryList: PrecioDelivery[];
  filteredPrecioDeliveryList: PrecioDelivery[];
  focusableItemList: Record<string, any>[];
  vueltoItemList: VueltoItem[] = [];
  totalVueltoGs: number = 0;
  totalVueltoRs: number = 0;
  totalVueltoDs: number = 0;
  currencyMask = new CurrencyMask();
  selectedPaisTelefono = 'py';
  prefixPy = '+595';
  prefixBr = '+55';
  ultimosDeliverys: Delivery[];
  deliverysActivos: Delivery[];
  deliverysUltimos10: Delivery[];
  deliverysObs: Observable<any>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DeliveryData,
    public dialogRef: MatDialogRef<PagoTouchComponent>,
    private getMonedas: MonedasGetAllGQL,
    private getBarriosPorCiudadId: BarriosPorCiudadIdGQL,
    private getPreciosDelivery: PreciosDeliveryGQL,
    private matDialogRef: MatDialog,
    private notificacionBar: NotificacionSnackbarService,
    private saveDelivery: SaveDeliveryGQL,
    private deliveryService: DeliveryService,
    private copyToClip: Clipboard
  ) {
  }

  ngAfterContentChecked(): void {
    this.focusableItemList = [
      {
        key: 'telefonoInput',
        value: this.telefonoInput,
      },
      {
        key: 'nombreClienteInput',
        value: this.nombreClienteInput,
      },
      {
        key: 'autoBarrioInput',
        value: this.autoBarrioInput,
      },
      {
        key: 'direccionInput',
        value: this.direccionInput,
      },
      {
        key: 'efectivoBtn',
        value: this.efectivoBtn,
      },
      {
        key: 'formaPago',
        value: this.formaPagoBtn,
      },
      {
        key: 'guaraniBtn',
        value: this.guaraniBtn,
      },
      {
        key: 'monedaBtn',
        value: this.monedaBtn,
      },
      {
        key: 'vueltoParaGsBtn',
        value: this.vueltoParaGsBtn,
      },
      {
        key: 'vueltoParaRsBtn',
        value: this.vueltoParaRsBtn,
      },
      {
        key: 'vueltoParaDsBtn',
        value: this.vueltoParaDsBtn,
      },
      {
        key: 'vueltoParaOtroBtn',
        value: this.vueltoParaOtroBtn,
      },
      {
        key: 'finalizarBtn',
        value: this.finalizarBtn,
      },
      {
        key: 'precioDeliveryBtn',
        value: this.precioDeliveryBtn,
      },
      {
        key: 'valorVueltoInput',
        value: this.valorVueltoInput,
      },
      {
        key: 'paisTelefonoSelect', //(keyup.enter)="onEnterEvent('paisTelefonoSelect')"
        value: this.paisTelefonoSelect,
      },
    ];
  }

  ngOnInit(): void {
    this.createForm();
    this.getPreciosDel();
    this.setCambios();
    this.getBarrios();
    this.getDeliverys();

    setTimeout(() => {
      this.telefonoInput.nativeElement.focus();
    }, 0);

    this.selectedPrecio.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        let valorDelivery = res.valor;
        let valorTotal = this.data.valor;
        this.formGroup.controls.valor.setValue(valorTotal + valorDelivery);
      }
    });
  }

  ngAfterViewInit(): void {}

  createForm() {
    this.formGroup = new FormGroup({
      telefono: new FormControl(null, Validators.required),
      prefixTelefono: new FormControl('py'),
      cliente: new FormControl(null),
      tipoDelivery: new FormControl(null),
      descripcionDelivery: new FormControl(null),
      direccion: new FormControl(null),
      entregador: new FormControl(null),
      vehiculo: new FormControl(null),
      moneda: new FormControl(null),
      valor: new FormControl(null),
      barrio: new FormControl(null),
      valorVuelto: new FormControl(null),
    });

    this.formGroup.controls.cliente.setValue('SIN NOMBRE');
    this.formGroup.controls.valor.setValue(this.data.valor);

    this.formGroup.controls.valor.valueChanges.pipe(untilDestroyed(this)).subscribe((res) => {
      this.setCambios();
      this.setVueltoPara();
    });

    this.formGroup.controls.prefixTelefono.setValue('py');
  }

  setCambios() {
    this.getMonedas.fetch().pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res.errors) {
        this.monedas = res.data.data;
        this.filteredMonedas = this.monedas.filter(
          (m) => m.denominacion != 'GUARANI'
        );
        if (this.selectedMoneda == null) {
          this.selectedMoneda = this.monedas.find(
            (m) => m.denominacion == 'GUARANI'
          );
        }
        this.cambioRs = this.monedas.find(
          (m) => m.denominacion === 'REAL'
        )?.cambio;
        this.cambioDs = this.monedas.find(
          (m) => m.denominacion === 'DOLAR'
        )?.cambio;
        this.valorRs = this.formGroup.controls.valor.value / this.cambioRs;
        this.valorDs = this.formGroup.controls.valor.value / this.cambioDs;
        this.setVueltoPara();
      }
    });
  }

  getBarrios() {
    this.getBarriosPorCiudadId
      .fetch({
        id: 1,
      }).pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!res.errors) {
          this.barrios = res.data.data;
        }
      });
  }

  getPreciosDel() {
    this.getPreciosDelivery.fetch().pipe(untilDestroyed(this)).subscribe((res) => {
      if (!res.errors) {
        this.precioDeliveryList = res.data.data;
        this.filteredPrecioDeliveryList = this.precioDeliveryList.filter(
          (p) => p.valor != 5000
        );
        this.selectedPrecio.setValue(this.precioDeliveryList[0]);
      }
    });
  }

  getDeliverys() {
    // this.getDeliverysByEstadoNotIn
    //   .fetch({ estado: DeliveryEstado.ENTREGADO }, { fetchPolicy: 'no-cache' })
    //   .subscribe((res) => {
    //     this.deliverysActivos = res.data.data.filter(
    //       (d) => d.estado != DeliveryEstado.CANCELADO
    //     );
    //   });
    // this.getDeliverysUltimos
    //   .fetch({ fetchPolicy: 'no-cache' })
    //   .subscribe((res) => {
    //     if (!res.errors) {
    //       this.deliverysUltimos10 = res.data.data;
    //     }
    //   });
    this.deliveryService.deliverysActivosSub.pipe(untilDestroyed(this)).subscribe(res=>{
      this.deliverysActivos = res;
    })

    this.deliveryService.ultimosDeliverysSub.pipe(untilDestroyed(this)).subscribe(res=>{
      this.ultimosDeliverys = res;
    })
  }

  onBarrioSearch() {
    if (this.timer != null) {
      clearTimeout(this.timer);
    }
    let text: string = this.formGroup.controls.barrio.value;
    this.filteredBarrios = this.barrios?.filter(
      (b) => b.id + '' == text || b.descripcion.includes(text?.toUpperCase())
    );

    if (this.filteredBarrios.length == 1) {
      this.timer = setTimeout(() => {
        this.formGroup.controls.barrio.setValue(this.filteredBarrios[0].id);
        this.matBarrioTrigger.closePanel();
        this.onBarrioAutoClosed();
      }, 1000);
    }
  }

  displayBarrio(value?: number) {
    let res = value ? this.barrios.find((_) => _.id === value) : undefined;
    this.selectedBarrio = res;
    this.selectedPrecio.setValue(this.selectedBarrio?.precioDelivery);
    return res ? res.id + ' - ' + res.descripcion : undefined;
  }

  onBarrioAutoClosed() {
    setTimeout(() => {
      this.autoBarrioInput.nativeElement.select();
    }, 0);
  }

  onKeydownEvent(key) {}

  selectGuarani() {
    this.selectedMoneda = this.monedas.find((m) => m.denominacion == 'GUARANI');
  }

  selectMoneda() {
    if (this.selectedMoneda.denominacion == 'GUARANI') {
      this.vueltoParaGsBtn._elementRef.nativeElement.focus();
    } else if (this.selectedMoneda.denominacion == 'REAL') {
      this.vueltoParaRsBtn._elementRef.nativeElement.focus();
    } else {
      this.vueltoParaOtroBtn._elementRef.nativeElement.focus();
    }
  }

  setVueltoPara() {
    let valor = this.formGroup.controls.valor.value;
    let factorGs = Math.floor(valor / 100001) + 1;
    this.vueltoParaGs = factorGs * 100000;
    this.selectedVueltoPara = this.vueltoParaGs;
    let factorRs = Math.floor(valor / this.cambioRs / 100.1) + 1;
    this.vueltoParaRs = factorRs * 100;
    let factorDs = Math.floor(valor / this.cambioDs / 100.1) + 1;
    this.vueltoParaDs = factorDs * 100;
  }

  selectVueltoPara(moneda?: Moneda) {
    if (moneda.denominacion == 'GUARANI') {
      this.selectedVueltoPara = this.vueltoParaGs;
    } else if (moneda.denominacion == 'REAL') {
      this.selectedVueltoPara = this.vueltoParaRs;
    } else if (moneda.denominacion == 'DOLAR') {
      this.selectedVueltoPara = this.vueltoParaDs;
    } else {
      this.selectedVueltoPara = -1;
    }
  }

  sumarConTotal() {
    let valor = this.formGroup.controls.valor.value;
    this.formGroup.controls.valor.setValue(
      valor + this.selectedPrecio.value.valor
    );
  }

  selectOtro() {}

  onEnterEvent(item) {
    let aux: ElementRef<any> | MatButton;
    switch (item) {
      case 'paisTelefonoSelect':
        aux = this.focusableItemList.find(
          (f) => f.key == 'telefonoInput'
        ).value;
        break;
      case 'telefonoInput':
        aux = this.focusableItemList.find(
          (f) => f.key == 'nombreClienteInput'
        ).value;
        break;
      case 'nombreClienteInput':
        aux = this.focusableItemList.find(
          (f) => f.key == 'autoBarrioInput'
        ).value;
        break;
      case 'autoBarrioInput':
        if (this.timer != null) {
          clearTimeout(this.timer);
        }
        aux = this.focusableItemList.find(
          (f) => f.key == 'direccionInput'
        ).value;
        break;
      case 'direccionInput':
        if (this.selectedBarrio != null) {
          aux = this.focusableItemList.find(
            (f) => f.key == 'efectivoBtn'
          ).value;
        } else {
          aux = this.focusableItemList.find(
            (f) => f.key == 'precioDeliveryBtn'
          ).value;
        }

        break;
      case 'precioDeliveryBtn':
        aux = this.focusableItemList.find((f) => f.key == 'efectivoBtn').value;
        break;
      case 'efectivoBtn':
        if (this.selectedPago != 'Efectivo') {
          this.selectedMoneda = null;
          this.selectedVueltoPara = null;
          aux = this.focusableItemList.find(
            (f) => f.key == 'finalizarBtn'
          ).value;
        } else {
          aux = this.focusableItemList.find((f) => f.key == 'guaraniBtn').value;
        }
        break;
      case 'guaraniBtn':
        aux = this.focusableItemList.find(
          (f) => f.key == 'vueltoParaGsBtn'
        ).value;
        break;
      case 'REAL':
        aux = this.focusableItemList.find(
          (f) => f.key == 'vueltoParaRsBtn'
        ).value;
        break;
      case 'DOLAR':
        aux = this.focusableItemList.find(
          (f) => f.key == 'vueltoParaDsBtn'
        ).value;
        break;
      case 'vueltoParaOtro':
        aux = this.focusableItemList.find(
          (f) => f.key == 'valorVueltoInput'
        ).value;
        break;
      case 'valorVueltoInput':
        let vuelto = this.formGroup.controls.valorVuelto.value;
        this.addVueltoItem(vuelto);
        break;
      case 'valorVueltoInput':
      case 'vueltoParaGsBtn':
      case 'vueltoParaRsBtn':
      case 'vueltoParaDsBtn':
        aux = this.focusableItemList.find((f) => f.key == 'finalizarBtn').value;
      default:
        break;
    }
    if (aux != null) {
      if (aux instanceof ElementRef) {
        aux.nativeElement.focus();
      } else {
        aux._elementRef.nativeElement.focus();
      }
    } else {
    }
  }

  deleteVueltoItem(i) {
    this.vueltoItemList.splice(i, 1);
  }

  addVueltoItem(valor?) {
    let vuelto = valor != null ? valor : this.selectedVueltoPara;
    this.formGroup.controls.valorVuelto.reset();
    this.vueltoItemList.push({
      valor:
        vuelto -
        this.formGroup.controls.valor.value / this.selectedMoneda.cambio,
      formaPago: this.selectedPago,
      moneda: this.selectedMoneda,
    });
    this.actualizarVueltos();
  }

  onBilletesSelect(text) {
    let moneda: Moneda = this.monedas.find((m) => m.denominacion == text);
    if (moneda != null) {
      this.matDialogRef
        .open(SeleccionarBilletesTouchComponent, {
          data: {
            moneda,
            isVuelto: false,
            valor: 0,
          },
        })
        .afterClosed().pipe(untilDestroyed(this))
        .subscribe((res: SelectBilletesResponseData) => {
          if (res != null) {
            this.selectedMoneda = res.moneda;
            this.selectedPago = 'Efectivo';
            this.addVueltoItem(res.valor);
          }
        });
    }
  }

  onRedondearClick(index) {
    this.matDialogRef
      .open(RedondeoDialogComponent, {
        data: {
          isRedondeo: true,
          moneda: this.vueltoItemList[index].moneda,
          valor: this.vueltoItemList[index].valor,
        },
        width: '50vw',
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.vueltoItemList[index].valor = res.valor;
          this.actualizarVueltos();
        }
      });
  }

  //funcion para cambiar la moneda seleccionada como vuelto
  onMonedaChange(index) {
    this.matDialogRef
      .open(RedondeoDialogComponent, {
        data: {
          isRedondeo: false,
          moneda: this.vueltoItemList[index].moneda,
        },
        width: '50vw',
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          let valorActual =
            this.vueltoItemList[index].valor *
            this.vueltoItemList[index].moneda.cambio;
          let nuevoValor = valorActual / res.moneda.cambio;
          this.vueltoItemList[index].moneda = res.moneda;
          this.vueltoItemList[index].valor = nuevoValor;
          this.actualizarVueltos();
        }
      });
  }

  actualizarVueltos() {
    this.totalVueltoGs = 0;
    this.totalVueltoRs = 0;
    this.totalVueltoDs = 0;
    this.vueltoItemList.forEach((v) => {
      switch (v.moneda.denominacion) {
        case 'GUARANI':
          this.totalVueltoGs += v.valor;
          break;
        case 'REAL':
          this.totalVueltoRs += v.valor;
          break;
        case 'DOLAR':
          this.totalVueltoDs += v.valor;
          break;

        default:
          break;
      }
    });
  }

  onFinalizarBtn() {
    if (this.formGroup.invalid) {
      this.notificacionBar.notification$.next({
        color: NotificacionColor.warn,
        texto: 'Ingresar número de teléfono',
        duracion: 2,
      });
    } else {
      let deliveryInput: DeliveryInput = {
        id: null,
        precioId: this.selectedPrecio.value.id,
        telefono:
          (this.selectedPaisTelefono == 'py' ? this.prefixPy : this.prefixBr) +
          this.formGroup.controls.telefono.value,
        direccion: this.formGroup.controls.direccion.value,
        estado: DeliveryEstado.ABIERTO,
        entregadorId: 1,
        usuarioId: 1,
        valor: this.formGroup.controls.valor.value,
        vehiculoId: null,
        ventaId: null,
        barrioId: this.selectedBarrio?.id,
      };
      let vueltoList = [];
      this.vueltoItemList.forEach((v) => {
        let vueltoItem: VueltoItemInput = {
          monedaId: v.moneda.id,
          valor: v.valor,
        };
        vueltoList.push(vueltoItem);
      });
      // delivery.vuelto = vueltoList;
      this.dialogRef.close({ deliveryInput, vueltoList });
    }
  }

  copiar(item, copyText?) {
    let texto = '';
    if (copyText != null) {
      this.copyToClip.copy(copyText);
    } else {
      switch (item) {
        case 'telefono':
          texto =
            (this.selectedPaisTelefono == 'py'
              ? this.prefixPy
              : this.prefixBr) + this.formGroup.controls.telefono.value;
          this.copyToClip.copy(texto);

          break;

        default:
          break;
      }
    }
    this.notificacionBar.notification$.next({
      color: NotificacionColor.info,
      texto: 'Copiado con éxito',
      duracion: 1,
    });
  }
}
