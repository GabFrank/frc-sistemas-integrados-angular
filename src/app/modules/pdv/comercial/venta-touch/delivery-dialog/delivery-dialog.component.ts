import {
  Component,
  ElementRef, OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { Moneda } from '../../../../../modules/financiero/moneda/moneda.model';
import { Barrio } from '../../../../../modules/general/barrio/barrio.model';
import { Delivery } from '../../../../../modules/operaciones/delivery/delivery.model';

export class DeliveryData {
  valor: number;
  monedas: Moneda[];
}

interface VueltoItem {
  valor: number;
  moneda: Moneda;
  formaPago: string;
}

import { UntilDestroy } from '@ngneat/until-destroy';
import { MainService } from '../../../../../main.service';
import { BarrioService } from '../../../../general/barrio/barrio.service';
import { PrecioDelivery } from '../../../../operaciones/delivery/precio-delivery.model';
import { DeliveryService } from './delivery.service';
import { BotonComponent } from '../../../../../shared/components/boton/boton.component';
import { comparatorLike } from '../../../../../commons/core/utils/string-utils';
import { FormaPagoService } from '../../../../financiero/forma-pago/forma-pago.service';
import { FormaPago } from '../../../../financiero/forma-pago/forma-pago.model';
import { MonedaService } from '../../../../financiero/moneda/moneda.service';
import { PagoItem } from '../pago-touch/pago-touch.component';
import { CurrencyMaskInputMode } from 'ngx-currency';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-delivery-dialog',
  templateUrl: './delivery-dialog.component.html',
  styleUrls: ['./delivery-dialog.component.css'],
})
export class DeliveryDialogComponent implements OnInit {

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

  totalGs = 94000;
  totalConDelivery = 0;
  cambioRs = 1250;
  cambioDs = 6900;
  cambioArg = 40;
  selectedVueltoList = []

  selectedDelivery: Delivery;
  formGroup: FormGroup;
  telefonoControl = new FormControl(null, [Validators.required, Validators.minLength(9), Validators.pattern("^[0-9]*$")])
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
  pagoItemList: PagoItem[] = []
  valorControl = new FormControl(0)
  vueltoControl = new FormControl(null)
  vueltoListGs: number[] = []
  vueltoListRs: number[] = []
  vueltoListDs: number[] = []
  saldoGs = 0;

  prefixList = ['+595', '+55']

  constructor(
    private barrioService: BarrioService,
    private mainService: MainService,
    private deliveryService: DeliveryService,
    private formaPagoService: FormaPagoService,
    private monedaService: MonedaService
  ) {

    this.totalConDelivery = this.totalGs;

    this.barrioService.onGetPorCiudadId(this.mainService?.sucursalActual?.ciudad?.id).subscribe(res => {
      this.barrioList = res;
      this.filteredBarriosList = res;
    })

    this.monedaService.onGetAll().subscribe(res => {
      this.monedaList = res;
      this.monedaControl.setValue(this.monedaList[0])
      this.deliveryService.onGetPreciosDelivery().subscribe(res => {
        this.precioDeliveryList = res;
        this.precioControl.setValue(this.precioDeliveryList[0])
        this.totalConDelivery += this.precioControl.value?.valor;
        this.calcularVuelto()
        setTimeout(() => {
          this.navigateVuelto(0)
        }, 0);
      })
    })

    this.barrioFilterControl.valueChanges.subscribe(res => {
      this.filteredBarriosList = this.barrioList.filter(b => b.descripcion?.toUpperCase().includes(res?.toUpperCase()))
    })

    this.formaPagoService.onGetAllFormaPago().subscribe(res => {
      this.formaPagoList = res;
      this.formaPagoControl.setValue(this.formaPagoList[0])
    })


  }

  ngOnInit(): void {
    this.createForm()
    this.telefonoPrefixControl.setValue(this.prefixList[0])
    setTimeout(() => {
      this.matPrefixSelect.focus()
    }, 500);


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
    this.direccionInput.nativeElement.select()
  }

  verificarTelefono() {
    if (this.telefonoControl.valid) {
      if (this.telefonoControl.value[0] == '0') {
        let telefono: string = this.telefonoControl.value;
        this.telefonoControl.setValue(telefono.substring(1))
      }
    }
  }

  onDireccionEnter() {
    this.barrioSelect.focus()
    this.barrioSelect.open()
  }

  navigatePrecios(index) {
    if (index < 0) index = this.precioDeliveryList.findIndex(p => p.id == this.precioControl.value?.precioDelivery?.id);
    if (index > this.preciosListBtn.length - 1) {
      console.log(index);
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

  onBarrioChange(e: MatSelectChange) {
    // if (e.value?.precioDelivery) {
    //   let index = this.precioDeliveryList.findIndex(p => p.id == e.value?.precioDelivery?.id)
    //   if (index >= 0) {
    //     this.navigatePrecios(index)
    //   } else {
    //     this.navigatePrecios(0)
    //   }
    // }
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
      this.calcularVuelto()
    }, 100);
  }

  onVueltoKeyUp(key) {
    if (Number(key) == +key) {
      let index = this.selectedVueltoList.findIndex(f => f.id == +key);
      if (index != -1) {
        this.navigateVuelto(index)
        this.valorInput.nativeElement.select()
      }
    }
  }

  onVueltoSelect() {
    this.valorInput.nativeElement.select()
  }

  onDeleteItem(item, i) {

  }

  onValorEnter() {

  }

  onValorFocus() {
    this.valorInput.nativeElement.select()
  }

}
