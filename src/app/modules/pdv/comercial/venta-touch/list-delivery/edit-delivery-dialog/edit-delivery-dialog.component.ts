import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { PROPAGAR_ERROR_DE_RED } from '../../../../../../generics/generic-crud.service';
import { NotificacionSnackbarService } from '../../../../../../notificacion-snackbar.service';
import { ConfiguracionCobroService } from '../../../../../financiero/configuracion-cobro/configuracion-cobro.service';
import { aumentoPermitido, aumentosRegistradosGs, ConfiguracionCobro, mensajeTopeAumento } from '../../../../../financiero/configuracion-cobro/configuracion-cobro.model';
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
import { BuscadorFieldComponent } from '../../../../../../shared/components/buscador-field/buscador-field.component';
import { Cliente } from '../../../../../personas/clientes/cliente.model';
import { DescuentoDialogData, DescuentoDialogComponent } from '../../pago-touch/descuento-dialog/descuento-dialog.component';
import { VentaService } from '../../../../../operaciones/venta/venta.service';
import { Venta } from '../../../../../operaciones/venta/venta.model';
import { esRechazoDelServidor } from '../../../../../../commons/core/utils/graphqlErrorUtils';
import { cotizacionEmpresa, factorABase, redondearEnMoneda, saldoCerrado } from '../../moneda-pdv.util';
import { aplicarMonedaALaVenta } from '../../moneda-pdv-guardado';

export interface EditDeliveryDialogData {
  delivery: Delivery;
  monedaList?: Moneda[]
  cambioRs?: number;
  cambioDs?: number;
  formaPagoList?: FormaPago[];
  /**
   * La moneda del PDV y la de la empresa, solo si el PDV opera en otra moneda que la de la empresa (Fase 4).
   * Sin ellas el diálogo trabaja como siempre. Con ellas, `cambioRs` / `cambioDs` son unidades de la moneda del PDV
   * por R$ / US$.
   */
  monedaPdv?: Moneda;
  monedaEmpresa?: Moneda;
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
  @ViewChild("clienteField", { static: false }) clienteField: BuscadorFieldComponent;
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
  /** Tope del aumento (#546). `null` mientras carga o si falla: `aumentoPermitido` lo lee como 20%. */
  configCobro: ConfiguracionCobro = null;
  vueltoParaControl = new FormControl(null)
  telefonoControl = new FormControl(null, [Validators.required, Validators.minLength(8)])
  vehiculoControl = new FormControl()
  clienteControl = new FormControl<Cliente>(null)
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

  /** true solo si el PDV opera en otra moneda que la de la empresa. Con false todo es exactamente lo de siempre. */
  esOtraMoneda = false;
  monedaPdv: Moneda = null;
  monedaEmpresa: Moneda = null;
  /** La tarifa de envío (que está en la moneda de la empresa) en la moneda del PDV. Solo con otra moneda del PDV. */
  envioBase: number = null;
  /** Máscara del campo «valor» según la moneda elegida. */
  opcionesValor: any = this.currencyMask.currencyOptionsNoGuarani;
  /** Unidades de la empresa por 1 unidad de la moneda del PDV, y cómo se muestra un monto en ella. */
  cotizacionPdv: number = null;
  formatoBase = '1.0-0';
  /** Totales del delivery en cada moneda (con otra moneda del PDV): se muestran dividiendo el total por `divisor`. */
  filasTotal: { bandera: string | null; simbolo: string; divisor: number | null; formato: string }[] = [];
  /** Cómo se muestra el valor de cada línea según su moneda (id), con otra moneda del PDV. */
  formatoPorMoneda: { [monedaId: string]: string } = {};

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
  /**
   * Un delivery guardado sin tarifa no pudo reconstruir sus cobros ya guardados: aunque después cargue la tarifa,
   * el saldo no los contaría y se podría cobrar de nuevo. Hay que volver a abrirlo (#390).
   */
  private cobrosSinReconstruir = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: EditDeliveryDialogData,
    private deliveryService: DeliveryService,
    private matDialogRef: MatDialogRef<EditDeliveryDialogComponent>,
    private matDialog: MatDialog,
    private ventaService: VentaService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private configuracionCobroService: ConfiguracionCobroService,
    private monedasService: MonedaService,
  ) {
    
    this.selectedDelivery = data?.delivery;

    this.cambioRs = data?.cambioRs;
    this.cambioDs = data?.cambioDs;
    if (data?.monedaPdv != null && data?.monedaEmpresa != null) {
      this.esOtraMoneda = true;
      this.monedaPdv = data.monedaPdv;
      this.monedaEmpresa = data.monedaEmpresa;
      this.cotizacionPdv = cotizacionEmpresa(this.monedaPdv, this.monedaEmpresa);
      const dec = this.monedaPdv.decimales ?? 2;
      this.formatoBase = `1.${dec}-${dec}`;
    }

    if (this.selectedDelivery?.venta?.valorTotal == null) {
      this.selectedDelivery.venta.valorTotal = 0;
      this.selectedDelivery?.venta?.ventaItemList?.forEach(vi => {
        this.selectedDelivery.venta.valorTotal += (vi.cantidad * (vi.precio - vi.valorDescuento))
      })
    }

    if (this.selectedDelivery?.id != null) {
      this.telefonoControl.setValue(this.selectedDelivery.telefono)
      this.direccionControl.setValue(this.selectedDelivery.direccion)
      this.clienteControl.setValue(this.selectedDelivery?.venta?.cliente ?? null);
      this.selectedDelivery?.precio != null ? this.onPrecioSelect(this.selectedDelivery.precio) : null;
    }
  }

  ngOnInit(): void {
    this.cargarPrecios();
    // Tope del aumento (#546), del filial. Si no responde, `configCobro` queda en null: tope del 20%.
    this.configuracionCobroService.onGetConfiguracionPdv().pipe(untilDestroyed(this)).subscribe({
      next: (config) => (this.configCobro = config),
      error: () => (this.configCobro = null),
    });

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


    setTimeout(() => {
      this.monedaList = this.data?.monedaList ?? [];
      if (this.monedaList.length === 0 || !(this.data?.formaPagoList?.length > 0)) {
        this.notificacionSnackbar.openWarn('No se cargaron las monedas o formas de pago del POS: no se puede cobrar ni guardar el delivery.', 6);
      }
      if (this.esOtraMoneda) {
        this.formatoPorMoneda = this.monedaList.reduce((acc, m) => {
          const dec = this.monedasService.decimalesDeMoneda(m);
          acc[m.id] = `1.${dec}-${dec}`;
          return acc;
        }, {} as { [monedaId: string]: string });
        this.armarFilasTotal();
      }
      this.onMonedaVueltoSelect(this.monedaPorDefecto())
      setTimeout(() => {
        this.onMonedaSelect(this.monedaPorDefecto())
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
        if (res == "") { this.selectedMoneda = null; this.actualizarOpcionesValor(); }
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

  // ---- Fase 4: cuentas en la moneda del PDV. Con la moneda de la empresa todos devuelven lo de siempre. ----

  /** La tarifa de envío en la moneda en que se cobra: la de la tarifa tal cual, o llevada a la moneda del PDV. */
  private envio(): number {
    return this.esOtraMoneda ? this.envioBase : this.selectedPrecio?.valor;
  }

  /** Unidades de la moneda del PDV por 1 unidad de `moneda` (con `cambio` propio si es una línea ya guardada). */
  private factorDe(moneda: Moneda | null | undefined, cambio?: number | null): number | null {
    if (moneda == null) return null;
    const m = cambio != null ? { id: moneda.id, cambio } : moneda;
    return factorABase(m, this.monedaPdv, this.monedaEmpresa);
  }

  /** El cambio de siempre (guaraníes por unidad), o el factor a la moneda del PDV. */
  private cambioDe(moneda: Moneda | null | undefined): number {
    return this.esOtraMoneda ? this.factorDe(moneda) : moneda?.cambio;
  }

  private factorDeLinea(item: CobroDetalle): number {
    return this.factorDe(item.moneda, item.cambio) ?? item.cambio;
  }

  /** La moneda que se propone para cobrar: la primera de siempre, o la del PDV. */
  private monedaPorDefecto(): Moneda {
    if (!this.esOtraMoneda) return this.monedaList[0];
    return this.monedaList.find(m => String(m.id) === String(this.monedaPdv.id)) ?? this.monedaPdv;
  }

  /** La moneda del descuento: siempre la base (el guaraní de siempre, o la del PDV). */
  private monedaDelDescuento(): Moneda {
    if (!this.esOtraMoneda) return this.monedaList.find(m => m.denominacion == 'GUARANI');
    return this.monedaPorDefecto();
  }

  /** La moneda del PDV primero, después la de la empresa, el real y el dólar (sin repetir ninguna). */
  private armarFilasTotal(): void {
    const bandera = (m: Moneda): string | null => {
      const d = (m?.denominacion || '').toUpperCase();
      if (d.includes('GUARANI')) return 'assets/flags/py/py32.png';
      if (d.includes('REAL')) return 'assets/flags/br/br32.png';
      if (d.includes('DOLAR')) return 'assets/flags/usa/usa32.png';
      return null;
    };
    const candidatas = [
      this.monedaPdv,
      this.monedaList.find(m => String(m.id) === String(this.monedaEmpresa?.id)) ?? this.monedaEmpresa,
      this.monedaList.find(m => m.denominacion == 'REAL'),
      this.monedaList.find(m => m.denominacion == 'DOLAR'),
    ].filter(m => m != null);
    const vistas = new Set<string>();
    this.filasTotal = [];
    candidatas.forEach(m => {
      if (vistas.has(String(m.id))) return;
      vistas.add(String(m.id));
      const dec = this.monedasService.decimalesDeMoneda(m);
      this.filasTotal.push({
        bandera: bandera(m),
        simbolo: m.simbolo || m.denominacion || '',
        divisor: String(m.id) === String(this.monedaPdv.id) ? 1 : this.factorDe(m),
        formato: `1.${dec}-${dec}`,
      });
    });
  }

  /** Lo que falta cobrar. Con otra moneda del PDV, redondeado a sus decimales (si no, el ruido del flotante nunca cierra en 0). */
  private saldoActual(): number {
    const saldo = (this.selectedDelivery.venta.valorTotal + this.envio()) - this.valorParcialPagado;
    return this.esOtraMoneda ? redondearEnMoneda(saldo, this.monedaPdv) : saldo;
  }

  private esCero(valor: number): boolean {
    return this.esOtraMoneda ? saldoCerrado(valor, this.monedaPdv.decimales ?? 2) : valor == 0;
  }

  private actualizarOpcionesValor(): void {
    this.opcionesValor = this.esOtraMoneda
      ? this.monedasService.currencyOptionsByMoneda(this.selectedMoneda)
      : (this.selectedMoneda?.id == 1 ? this.currencyMask.currencyOptionsGuarani : this.currencyMask.currencyOptionsNoGuarani);
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
          this.vueltoControl.setValue(this.selectedDelivery.venta.valorTotal + this.envio())
          this.saldoControl.setValue(this.selectedDelivery.venta.valorTotal + this.envio())
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
    if (this.cobrosSinReconstruir) {
      this.notificacionSnackbar.openWarn('No se pudieron cargar los cobros ya registrados de este delivery: cerrá y volvé a abrirlo.', 6);
      return true;
    }
    if (this.selectedPrecio == null) {
      this.notificacionSnackbar.openWarn(this.sinTarifas
        ? 'No hay tarifas de delivery configuradas: no se puede cobrar ni guardar el delivery.'
        : this.preciosFallo
          ? 'Falta la tarifa de delivery: usá «Reintentar tarifas» antes de cobrar o guardar.'
          : 'Elegí la tarifa de delivery antes de cobrar o guardar.', 6);
      return true;
    }
    return false;
  }

  onPrecioSelect(e) {
    if (e?.id != null) {
      this.selectedPrecio = e;
      if (this.esOtraMoneda) {
        // La tarifa está en la moneda de la empresa: se muestra y se suma en la del PDV.
        const cot = cotizacionEmpresa(this.monedaPdv, this.monedaEmpresa);
        this.envioBase = cot ? redondearEnMoneda(+this.selectedPrecio.valor / cot, this.monedaPdv) : null;
      }
      this.precioControl.setValue(
        this.selectedPrecio?.id + " - " + this.selectedPrecio?.descripcion + " - " + (this.esOtraMoneda ? this.envioBase : this.selectedPrecio?.valor)
      );
    }
    this.calcularVueltoPara()
    // this.calcularVuelto()
  }

  onMonedaAutocompleteClose() {
    setTimeout(() => {
      this.monedaInput.nativeElement.select();
    }, 100);
  }

  onMonedaSelect(e) {
    let valorEnGs = this.vueltoControl.value * this.cambioDe(this.selectedMoneda);
    if (e?.id != null) {
      this.selectedMoneda = e;
      this.monedaControl.setValue(
        this.selectedMoneda?.id + " - " + this.selectedMoneda?.denominacion
      );
      this.vueltoControl.setValue(valorEnGs / this.cambioDe(this.selectedMoneda))
    }
    this.actualizarOpcionesValor();
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
    this.clienteField.select()
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
      if (esLineaNueva) {
        this.bloqueaCobroYGuardado();
      } else {
        this.cobrosSinReconstruir = true;
      }
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
    if (this.esCero(saldo)) {
      return this.telefonoInput.nativeElement.select()
    }
    if (this.isDescuento) {
      valor = this.saldoActual();
      this.selectedMoneda = this.monedaDelDescuento();
    }
    if (valor < 0) this.isVuelto = true;
    if (this.selectedFormaPago.descripcion == 'TARJETA' && (this.isVuelto || this.isDescuento || this.isAumento)) {
      this.selectedFormaPago = this.formaPagoList.find(f => f.descripcion == 'EFECTIVO');
    }
    if (this.vueltoControl.valid && !this.esCero(saldo)) {
      let item = new CobroDetalle;
      if (selectedItem != null) Object.assign(item, selectedItem);
      item.formaPago = this.selectedFormaPago
      item.moneda = this.selectedMoneda
      // Con otra moneda del PDV el saldo pasa por cotizaciones con decimales: una línea nueva se guarda redondeada a
      // los decimales de su moneda. Con la moneda de la empresa queda exactamente como siempre.
      item.valor = this.esOtraMoneda && esLineaNueva ? redondearEnMoneda(valor, item.moneda) : valor
      item.vuelto = this.isVuelto
      item.descuento = this.isDescuento
      item.aumento = this.isAumento
      item.pago = (!this.isVuelto && !this.isDescuento && !this.isAumento)
      // Una línea ya guardada (replay al reabrir) usa la cotización con la que se cobró si su
      // moneda hoy no tiene cotización: con la actual en null la línea sumaba 0 al saldo.
      const cambio = this.selectedMoneda?.cambio || (selectedItem?.id != null ? selectedItem?.cambio : null)
      // Cuánto vale 1 unidad de la moneda de la línea en la moneda con que se cuenta (el cambio de siempre, o el factor
      // a la moneda del PDV).
      const factor = this.esOtraMoneda ? this.factorDe(this.selectedMoneda ?? selectedItem?.moneda, cambio) : cambio
      if ((!cambio || factor == null) && esLineaNueva) {
        // Igual que pago-touch: una línea nueva en una moneda sin cotización sumaba valor * null (#390)
        this.notificacionSnackbar.openWarn(`No hay cotización cargada para ${this.selectedMoneda?.denominacion || 'la moneda seleccionada'}: no se puede registrar el cobro en esa moneda.`, 5);
        this.isVuelto = previo.isVuelto;
        this.isDescuento = previo.isDescuento;
        this.isAumento = previo.isAumento;
        this.selectedMoneda = previo.moneda;
        this.selectedFormaPago = previo.formaPago;
        this.actualizarOpcionesValor();
        return;
      }
      item.cambio = cambio
      // La cotización de la moneda de la línea solo viaja con otra moneda del PDV (una línea ya guardada no la vuelve a mandar).
      if (this.esOtraMoneda && esLineaNueva) {
        const cotizacion = cotizacionEmpresa(item.moneda, this.monedaEmpresa);
        if (cotizacion != null) item.cotizacion = cotizacion;
      }
      this.valorParcialPagado += item.valor * (factor ?? cambio);
      this.vueltoControl
        .setValue(this.saldoActual() / (factor ?? cambio));
      this.saldoControl.setValue(
        this.saldoActual()
      );
      if (this.selectedDelivery?.id != null && item?.id == null) {
        item.cobro = this.selectedDelivery?.venta?.cobro
        this.guardandoCobro = true;
        this.cobroSinRespuesta = true;
        this.ventaService.onSaveCobroDetalle(item.toInput(), false)
          .pipe(finalize(() => (this.guardandoCobro = false)), untilDestroyed(this))
          .subscribe({ error: (err) => {
            this.cobroSinRespuesta = false;
            this.cobroNoRegistrado(esRechazoDelServidor(err), previo);
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
            this.onMonedaSelect(this.monedaPorDefecto())
            if (this.esCero(this.vueltoControl.value)) {
              this.telefonoInput.nativeElement.focus()
              this.isVueltoControl.setValue(false)
            } else if (this.vueltoControl.value < 0) {
              this.isVueltoControl.setValue(true)
              this.formaPagoInput.nativeElement.focus()
              if ((this.vueltoControl.value) <= ((this.selectedDelivery.venta.valorTotal + this.envio()) * 0.2)) {
                this.isAumento = true
              }
            } else {
              this.isVueltoControl.setValue(false)
              this.formaPagoInput.nativeElement.focus()
              if ((this.vueltoControl.value) <= ((this.selectedDelivery.venta.valorTotal + this.envio()) * 0.2)) {
                this.isDescuento = true
              }
            }
          } else {
            // El filial responde vacío sin guardar nada (p. ej. ya hay un descuento en el cobro)
            this.cobroNoRegistrado(true, previo, true);
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
        this.onMonedaSelect(this.monedaPorDefecto())
        if (this.esCero(this.vueltoControl.value)) {
          this.telefonoInput.nativeElement.focus()
          this.isVueltoControl.setValue(false)
        } else if (this.vueltoControl.value < 0) {
          this.isVueltoControl.setValue(true)
          this.formaPagoInput.nativeElement.focus()
          if ((this.vueltoControl.value) <= ((this.selectedDelivery.venta.valorTotal + this.envio()) * 0.2)) {
            this.isAumento = true
          }
        } else {
          this.isVueltoControl.setValue(false)
          this.formaPagoInput.nativeElement.focus()
          if ((this.vueltoControl.value) <= ((this.selectedDelivery.venta.valorTotal + this.envio()) * 0.2)) {
            this.isDescuento = true
          }
        }
      }


    }

  }

  /**
   * La línea no quedó registrada: se devuelve el saldo a como estaba. Un rechazo del servidor no se aplicó y se
   * puede reintentar; sin respuesta (red, corte o respuesta vacía, que también llega como arreglo) pudo haberse
   * guardado igual en el filial, así que el delivery queda marcado y no se cobra ni se guarda hasta volver a leerlo
   * de la lista (#390). `sinMotivo`: el servidor no dio error ni resultado; el aviso es el único que ve el cajero.
   */
  private cobroNoRegistrado(rechazado: boolean, previo: {
    valorParcialPagado: number; vuelto: any; saldo: any; isVuelto: boolean; isDescuento: boolean; isAumento: boolean;
    moneda: Moneda; formaPago: FormaPago;
  }, sinMotivo = false): void {
    this.valorParcialPagado = previo.valorParcialPagado;
    this.vueltoControl.setValue(previo.vuelto);
    this.saldoControl.setValue(previo.saldo);
    this.isVuelto = previo.isVuelto;
    this.isDescuento = previo.isDescuento;
    this.isAumento = previo.isAumento;
    this.selectedMoneda = previo.moneda;
    this.selectedFormaPago = previo.formaPago;
    this.actualizarOpcionesValor();
    if (rechazado) {
      this.notificacionSnackbar.openWarn(sinMotivo
        ? 'El servidor no registró la línea (¿ya hay un descuento en este cobro?)'
        : 'No se pudo registrar el cobro: reintentá.', 5);
      return;
    }
    if (this.selectedDelivery) {
      this.selectedDelivery.cobroIncierto = true;
    }
    this.notificacionSnackbar.openWarn('No se pudo confirmar el cobro: cerrá y abrí el delivery de nuevo desde la lista antes de seguir.', 8);
  }

  onDeleteItem(item: CobroDetalle, i) {
    if (this.guardandoCobro) return;
    if (this.selectedPrecio == null || this.selectedDelivery?.cobroIncierto) {
      this.bloqueaCobroYGuardado();
      return;
    }
    // Vuelto en la moneda elegida; si no tiene cotización, la de la línea (antes dividía por null)
    const cambioVuelto = this.esOtraMoneda
      ? (this.cambioDe(this.selectedMoneda) || this.factorDeLinea(item) || 1)
      : (this.selectedMoneda?.cambio || item.cambio || 1);
    if (item?.id != null) {
      this.ventaService.onDeleteCobroDetalle(item.id, item.sucursalId, false).subscribe(res => {
        if (res) {
          this.valorParcialPagado -= item.valor * (this.esOtraMoneda ? this.factorDeLinea(item) : item.cambio);

          this.saldoControl.setValue(
            this.saldoActual()
          );
          this.vueltoControl.setValue(
            this.saldoActual() / cambioVuelto
          );
          this.cobroItemList.splice(i, 1);
          this.formaPagoInput.nativeElement.select()
          if (this.esCero(this.vueltoControl.value)) {
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
      this.valorParcialPagado -= item.valor * (this.esOtraMoneda ? this.factorDeLinea(item) : item.cambio);

      this.saldoControl.setValue(
        this.saldoActual()
      );
      this.vueltoControl.setValue(
        this.saldoActual() / cambioVuelto
      );
      this.cobroItemList.splice(i, 1);
      this.formaPagoInput.nativeElement.select()
      if (this.esCero(this.vueltoControl.value)) {
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
      venta.cliente = this.clienteControl.value;

      if (delivery?.venta?.cobro == null) {
        cobro = new Cobro()
        cobro.cobroDetalleList = this.cobroItemList;
      }

      if (this.esOtraMoneda && venta.id == null) {
        // Delivery nuevo armado con el carrito: sus ítems y su total están en la moneda del PDV. Se guarda el
        // equivalente en la moneda de la empresa más la moneda del PDV aparte, como una venta común. Uno ya guardado
        // conserva la moneda que tiene (el filial la respeta).
        const cot = cotizacionEmpresa(this.monedaPdv, this.monedaEmpresa);
        if (cot == null) {
          this.notificacionSnackbar.openWarn(
            `La moneda del PDV (${this.monedaPdv?.denominacion ?? ''}) no tiene cotización cargada: no se puede guardar el delivery.`, 6);
          return;
        }
        aplicarMonedaALaVenta(venta, {
          monedaPdv: this.monedaPdv, empresa: this.monedaEmpresa, cot,
          cambioRs: this.monedaList?.find(m => m.denominacion == 'REAL')?.cambio ?? null,
          cambioDs: this.monedaList?.find(m => m.denominacion == 'DOLAR')?.cambio ?? null,
        });
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
    let total = this.selectedDelivery?.venta.valorTotal + this.envio() - this.valorParcialPagado;
    let valor = this.vueltoParaControl.value;
    if (this.esOtraMoneda && this.cobroItemList?.length == 0) {
      // Con otra moneda del PDV el total está en ella: cada moneda se propone redondeada hacia arriba en su propia
      // unidad (guaraníes de a 100.000; reales y dólares de a 100), como siempre.
      this.selectedVuelto = 0;
      const enMoneda = (m: Moneda, paso: number): number | null => {
        const f = this.factorDe(m);
        return f ? (Math.floor((total / f) / paso) + 1) * paso : null;
      };
      this.vueltoGs = enMoneda(this.monedaList?.find(m => m.denominacion == 'GUARANI'), 100000);
      this.vueltoRs = this.cambioRs ? (Math.floor((total / this.cambioRs) / 100) + 1) * 100 : null;
      this.vueltoDs = this.cambioDs ? (Math.floor((total / this.cambioDs) / 100) + 1) * 100 : null;
      if (this.selectedMoneda?.denominacion == 'GUARANI') {
        this.vueltoControl.setValue(this.vueltoGs)
      } else if (this.selectedMoneda?.denominacion == 'REAL') {
        this.vueltoControl.setValue(this.vueltoRs)
      } else if (this.selectedMoneda?.denominacion == 'DOLAR') {
        this.vueltoControl.setValue(this.vueltoDs)
      } else if (this.selectedMoneda != null && String(this.selectedMoneda.id) === String(this.monedaPdv.id)) {
        // Otra moneda base: el saldo exacto.
        this.vueltoControl.setValue(redondearEnMoneda(total, this.monedaPdv))
      }
      return;
    }
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
    this.vueltoControl.setValue(((this.vueltoParaControl.value * this.cambioDe(this.selectedMoneda)) - (this.selectedDelivery?.venta?.valorTotal + this.envio())) / this.cambioDe(this.selectedMonedaVuelto));
    if (this.esCero(this.vueltoControl.value)) {
      this.telefonoInput.nativeElement.select()
    } else if (this.vueltoControl.value < 0) {
      this.vueltoParaControl.setValue(((this.vueltoControl.value * -1) * this.cambioDe(this.selectedMonedaVuelto)) / this.cambioDe(this.selectedMoneda))
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
    if (this.guardandoCobro || this.bloqueaCobroYGuardado()) return;
    let total = this.selectedDelivery.venta.valorTotal + this.envio();
    let saldo = this.saldoControl.value;

    let data: DescuentoDialogData = {
      valorTotal: total,
      cambioDs: this.cambioDs,
      cambioRs: this.cambioRs,
      saldo: saldo,
      // Con otra moneda del PDV, total y saldo están en ella y el diálogo devuelve el descuento en ella.
      monedaBase: this.esOtraMoneda ? this.monedaPdv : undefined,
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
    if (this.guardandoCobro || this.bloqueaCobroYGuardado()) return;
    let total = this.selectedDelivery.venta.valorTotal + this.envio();
    let valor =
      this.vueltoControl.value;
    if (valor < 0) {
      // Lo que se va a registrar (`vueltoControl`, en la moneda elegida) en guaraníes, más los aumentos ya cargados.
      const aumentoGs = this.esOtraMoneda
        ? -valor * (this.cambioDe(this.selectedMoneda) || 1) +
          this.cobroItemList.filter((l) => l.aumento).reduce((suma, l) => suma + Math.abs((l.valor ?? 0) * this.factorDeLinea(l)), 0)
        : -valor * (this.selectedMoneda?.cambio || 1) + aumentosRegistradosGs(this.cobroItemList);
      if (!aumentoPermitido(aumentoGs, total, this.configCobro)) {
        this.notificacionSnackbar.openWarn(mensajeTopeAumento(this.configCobro), 5);
        return;
      }
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
