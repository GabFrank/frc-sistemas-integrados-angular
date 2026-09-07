import {
  AfterViewInit,
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
import { CurrencyMaskInputMode } from "ngx-currency";
import { Subscription } from "rxjs";
import { MainService } from "../../../../../main.service";
import { MonedasGetAllGQL } from "../../../../../modules/financiero/moneda/graphql/monedasGetAll";
import { Moneda } from "../../../../../modules/financiero/moneda/moneda.model";
import { NotificacionColor, NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { DialogosService } from "../../../../../shared/components/dialogos/dialogos.service";
import { TecladoNumericoComponent } from "../../../../../shared/components/teclado-numerico/teclado-numerico.component";
import { FormaPago } from "../../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../../financiero/forma-pago/forma-pago.service";
import {
  SeleccionarBilletesTouchComponent,
  SelectBilletesResponseData,
} from "../seleccionar-billetes-touch/seleccionar-billetes-touch.component";

export interface PagoData {
  valor: number;
  itemList?: VentaItem[];
  descuento?: number;
  delivery?: Delivery;
  isCredito?: boolean;
}

export interface TarjetaPago {
  terminalPosId: number | null;
  /**
   * Proveedor de la terminal escaneada. Define que formato de QR se prueba primero al leer el
   * cupon: el cajero ya eligio la maquinita, asi que no hace falta adivinar.
   */
  proveedorServicioId?: number | null;
  monto: number;
  /** Moneda del COBRO. Sin ella, el monto guardado en venta_tarjeta no tiene unidad. */
  monedaId?: number | null;
  terminalDescripcion?: string;
  /** Datos del cupón ya leídos (en memoria, antes de que la venta se guarde). undefined = pospuesto. */
  datosCupon?: DatosCupon;
}

export interface PagoResponseData {
  cobroDetalleList: CobroDetalle[];
  facturado?: boolean;
  ventaCredito?: VentaCredito;
  itens?: VentaCreditoCuotaInput[];
  ticket?: boolean;
  cliente?: Cliente;
  tarjetaPagos?: TarjetaPago[];
  facturaLegalId?: number;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { AddFacturaLegalDialogComponent } from "../../../../financiero/factura-legal/add-factura-legal-dialog/add-factura-legal-dialog.component";
import { AddVentaCreditoDialogComponent } from "../../../../financiero/venta-credito/add-venta-credito-dialog/add-venta-credito-dialog.component";
import {
  VentaCredito,
  VentaCreditoCuotaInput,
} from "../../../../financiero/venta-credito/venta-credito.model";
import { VentaItem } from "../../../../operaciones/venta/venta-item.model";
import { Venta } from "../../../../operaciones/venta/venta.model";
import {
  DescuentoDialogComponent,
  DescuentoDialogData,
} from "./descuento-dialog/descuento-dialog.component";
import { Delivery } from "../../../../operaciones/delivery/delivery.model";
import { VentaService } from "../../../../operaciones/venta/venta.service";
import { CobroDetalle } from "../../../../operaciones/venta/cobro/cobro-detalle.model";
import { Cliente } from "../../../../personas/clientes/cliente.model";
import { BotonComponent } from "../../../../../shared/components/boton/boton.component";
import { MonedaService } from "../../../../financiero/moneda/moneda.service";
import { ScanTerminalPosDialogComponent, ScanTerminalPosResult } from "../../../../financiero/terminal-pos/scan-terminal-pos-dialog/scan-terminal-pos-dialog.component";
import { ConfiguracionVentaTarjetaService } from "../../../../financiero/venta-tarjeta/configuracion-venta-tarjeta-dialog/configuracion-venta-tarjeta.service";
import { ConfiguracionFacturaConVentaService } from "../../../../financiero/factura-legal/configuracion-factura-con-venta-dialog/configuracion-factura-con-venta.service";
import { EscanearCuponDialogComponent, EscanearCuponDialogData } from "../../../../financiero/venta-tarjeta/qr-pos/escanear-cupon-dialog/escanear-cupon-dialog.component";
import { esCobroTarjetaRegistrable } from "../../../../financiero/venta-tarjeta/qr-pos/cobro-tarjeta";
import { cuponVencido, DecimalesPorMoneda, HORAS_ANTIGUEDAD_MAXIMA } from "../../../../financiero/venta-tarjeta/qr-pos/qr-pos-parser";
import { DatosCupon } from "../../../../financiero/venta-tarjeta/qr-pos/formato-qr-pos.model";

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
  @ViewChild("container", { read: ElementRef }) container: ElementRef;

  @ViewChild("efectivoInput", { read: BotonComponent })
  efectivoInput: BotonComponent;

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
  selectedCliente: Cliente;
  isCredito = false;
  finalizarConFacturaHabilitado = false;
  facturaLegalId: number;

  /**
   * Se consulta UNA vez al abrir el diálogo (contra el filial, para funcionar sin internet) y
   * queda fijo durante todo el cobro. Si el flujo está deshabilitado, TARJETA funciona como
   * cualquier otra forma de pago: sin escaneo de terminal ni de cupón.
   */
  ventaTarjetaHabilitada = false;
  /** Decimales por moneda, para escalar el importe del cupón (viene en la menor unidad). */
  decimalesPorMoneda: DecimalesPorMoneda = {};

  selectedCurrency: any;

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

  isLoaded = 0;

  constructor(
    private monedasService: MonedaService,
    public mainService: MainService,
    private matDialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: PagoData,
    public dialogRef: MatDialogRef<PagoTouchComponent>,
    private dialog: DialogosService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private formaPagoService: FormaPagoService,
    private cargandoDialog: CargandoDialogService,
    private ventaService: VentaService,
    private configuracionVentaTarjetaService: ConfiguracionVentaTarjetaService,
    private configuracionFacturaConVentaService: ConfiguracionFacturaConVentaService
  ) {
    this.formaPagoList = [];
    if (data.delivery != null) {
      data.valor += data.delivery.precio.valor;
    }
    if (data?.isCredito == true) this.isCredito = true;
  }

  ngOnInit(): void {
    this.cargandoDialog.openDialog();
    //inicializando arrays
    //
    this.setPrecios();
    this.getFormaPagos();
    this.createForm();
    this.configuracionFacturaConVentaService.onGetConfiguracion().subscribe({
      next: (res) => {
        this.finalizarConFacturaHabilitado = res?.habilitado === true;
      },
      error: () => {
        this.finalizarConFacturaHabilitado = false;
      }
    });
    // Contra el filial (false = servidor local), para poder cobrar con tarjeta sin internet.
    this.configuracionVentaTarjetaService.onGetConfiguracion(false).subscribe({
      next: (config) => (this.ventaTarjetaHabilitada = config?.habilitado === true),
      error: () => (this.ventaTarjetaHabilitada = false),
    });
    setTimeout(() => {
      this.setFocusToValorInput();
      this.cargandoDialog.closeDialog();
    }, 500);

    this.formGroup.controls.moneda.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
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
    this.formaPagoSub = this.formaPagoService.formaPagoSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.formaPagoList = res;
        if (this.formaPagoList?.length > 0) {
          this.setFormaPago(this.formaPagoList[0]?.descripcion);
        }
        this.isLoaded++;
      });

    let loadTimer = setInterval(() => {
      if (this.isLoaded == 2) {
        if (this.data.descuento > 0) {
          let item = new CobroDetalle();
          item.formaPago = this.selectedFormaPago;
          item.moneda = this.selectedMoneda;
          item.valor = this.data.descuento;
          item.vuelto = false;
          item.descuento = true;
          item.aumento = false;
          item.pago = false;
          this.valorParcialPagado += item.valor;
          this.formGroup.controls.valor.setValue(
            this.data.valor - this.valorParcialPagado
          );
          this.formGroup.controls.saldo.setValue(
            this.data.valor - this.valorParcialPagado
          );
          this.cobroDetalleList.push(item);
        }
        if (this.data.delivery != null) {
          this.data.delivery?.venta?.cobro?.cobroDetalleList.forEach((c) => {
            this.isDescuento = c.descuento;
            this.isAumento = c.aumento;
            this.setFormaPago(c.formaPago?.descripcion);
            this.setMoneda(c.moneda?.denominacion, false);
            this.formGroup.get("valor").setValue(c.valor);
            this.addCobroDetalle(null, c);
          });
        }
        clearInterval(loadTimer);
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
            this.setFormaPago("EFECTIVO");
            break;
          case "F5":
            this.setFormaPago("TARJETA");
            break;
          case "F6":
            if (!this.isCredito) this.onConvenioClick();
            break;
          case "Escape":
            break;
          case "Enter":
            if (!this.isDialogOpen) {
              if (this.formGroup.controls.saldo.value == 0) {
                this.onFinalizar(null, null, false);
              } else {
                this.addCobroDetalle();
              }
            }
            break;
          case "F8":
            if (
              this.formGroup.controls.saldo.value != 0 &&
              this.formGroup.controls.saldo.value < 0
            ) {
              this.onAumento();
            }
            break;
          case "F9":
            if (
              this.formGroup.controls.saldo.value != 0 &&
              this.formGroup.controls.saldo.value > 0
            ) {
              this.onDescuento();
            }
            break;
          case "F10":
            if (!this.isDialogOpen) {
              if (this.formGroup.controls.saldo.value == 0) {
                this.onFinalizar(null, null, false);
              } else {
                this.addCobroDetalle();
              }
            }
            break;
          case "F12":
            this.onFactura();
            break;
          default:
            break;
        }
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

    this.formGroup
      .get("valor")
      .valueChanges.pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (this.formGroup.get("saldo").value < 0 && res > 0) {
          this.formGroup.get("valor").setValue(res * -1);
        } else {
        }
      });
  }

  getFormaPagos() {
    this.formaPagoService
      .onGetAllFormaPago(false)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.formaPagoList = res;
        this.selectedFormaPago = this.formaPagoList[0];
        this.setFormaPago(this.selectedFormaPago.descripcion);
      });
  }

  setPrecios() {
    this.monedasService.onGetAll(false)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.monedas = res;
        this.decimalesPorMoneda = (res || []).reduce((acc, m) => {
          if (m?.id != null) acc[m.id] = m.decimales ?? 0;
          return acc;
        }, {} as DecimalesPorMoneda);
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
        this.setFocusToValorInput();
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
    if (this.selectedFormaPago.descripcion == "CONVENIO") {
      this.onConvenioClick();
    }
  }

  displayFormaPago(value?: number) {
    let res = value
      ? this.formaPagoList?.find((_) => _.id === value)
      : undefined;
    this.selectedFormaPago = res;
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
            valor: this.data.valor - this.valorParcialPagado,
          },
          width: "60%",
        })
        .afterClosed()
        .pipe(untilDestroyed(this))
        .subscribe((res: SelectBilletesResponseData) => {
          if (res != null) {
            this.formGroup.controls.valor.setValue(res.valor);
            this.isVuelto = res.isVuelto;
            this.addCobroDetalle();
          }
          setTimeout(() => {
            this.setFocusToValorInput();
          }, 0);
          this.isDialogOpen = false;
        });
    }
  }

  setFormaPago(formaPago) {
    if (this.formaPagoList?.length > 0) {
      this.selectedFormaPago = this.formaPagoList.find(
        (fp) => fp.descripcion == formaPago
      );
      if (this.selectedFormaPago != null) {
        this.formGroup.controls.formaPago.setValue(this.selectedFormaPago.id);
      } else {
        this.notificacionSnackbar.openWarn("Forma de pago no válida");
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
    ref
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.formGroup.get("valor").setValue(res);
        }
      });
  }

  addCobroDetalle(selectedValor?: number, selectedItem?: CobroDetalle) {
    if (this.selectedFormaPago.descripcion == "CONVENIO") {
      this.onConvenioClick();
      return;
    }
    let valor =
      selectedValor != null ? selectedValor : this.formGroup.get("valor").value;
    let saldo = this.formGroup.get("saldo").value;
    if (saldo == 0) {
      return this.onFinalizar();
    }
    if (this.isDescuento) {
      // valor = (this.data.valor - this.valorParcialPagado);
      this.selectedMoneda = this.monedas.find(
        (m) => m.denominacion == "GUARANI"
      );
    }
    if (valor < 0 && !this.isAumento) this.isVuelto = true;
    if (
      this.selectedFormaPago.descripcion == "TARJETA" &&
      (this.isVuelto || this.isDescuento)
    ) {
      this.selectedFormaPago = this.formaPagoList.find(
        (f) => f.descripcion == "EFECTIVO"
      );
    }
    // Si selectedItem ya trae id, esta llamada es un REPLAY de una línea ya persistida (por
    // ejemplo, al reabrir un delivery: ngOnInit reconstruye cobroDetalleList reinvocando
    // addCobroDetalle por cada línea que el cobro ya tenía guardada). El escaneo automático
    // solo tiene sentido para una línea nueva que el cajero está cargando ahora — dispararlo en
    // un replay abriría un diálogo modal por cada tarjeta ya cobrada en sesiones anteriores.
    const esLineaNueva = selectedItem?.id == null;
    if (this.formGroup.valid && saldo != 0) {
      let item = new CobroDetalle();
      if (selectedItem != null) Object.assign(item, selectedItem);
      item.formaPago = this.selectedFormaPago;
      item.moneda = this.selectedMoneda;
      item.cambio = this.selectedMoneda.cambio;
      item.valor = valor;
      item.vuelto = this.isVuelto;
      item.descuento = this.isDescuento;
      item.aumento = this.isAumento;
      item.pago = !this.isVuelto && !this.isDescuento && !this.isAumento;
      this.valorParcialPagado += item.valor * item.moneda.cambio;

      this.formGroup
        .get("valor")
        .setValue(
          (this.data.valor - this.valorParcialPagado) /
          this.selectedMoneda.cambio
        );
      this.formGroup.controls.saldo.setValue(
        this.data.valor - this.valorParcialPagado
      );
      if (this.data?.delivery != null && item?.id == null) {
        item.cobro = this.data?.delivery?.venta?.cobro;
        this.ventaService
          .onSaveCobroDetalle(item.toInput(), false)
          .pipe(untilDestroyed(this))
          .subscribe((cbRes) => {
            if (cbRes != null) {
              item.id = cbRes.id;
              item.requiereRegistroTarjeta = esLineaNueva;
              this.cobroDetalleList.push(item);
              if (esLineaNueva) this.escanearSiEsTarjeta(item);
            }
          });
      } else {
        item.requiereRegistroTarjeta = esLineaNueva;
        this.cobroDetalleList.push(item);
        if (esLineaNueva) this.escanearSiEsTarjeta(item);
      }
    }
    this.isVuelto = false;
    this.isDescuento = false;
    this.isAumento = false;
    this.setFormaPago(this.formaPagoList[0]?.descripcion);
    this.setFocusToValorInput();
  }

  setFocusToValorInput() {
    this.valorInput.nativeElement.focus();
    setTimeout(() => {
      this.valorInput.nativeElement.select();
    }, 100);
  }

  /**
   * El escaneo de cada tarjeta ya pasó (o se pospuso) al agregarla — ver
   * {@link escanearSiEsTarjeta}. Acá solo se junta lo que cada línea ya tiene en memoria y se
   * cierra: nada de diálogos ni de llamadas al backend en este punto. La venta todavía no
   * existe, así que tampoco hay nada que podamos guardar del lado de tarjeta hasta que
   * venta-touch confirme el saveVenta.
   */
  onFinalizar(
    ventaCredito?: VentaCredito,
    itens?: VentaCreditoCuotaInput[],
    ticket?: boolean
  ) {
    const tarjetaPagos: TarjetaPago[] = this.ventaTarjetaHabilitada
      ? this.cobroDetalleList
          // `requiereRegistroTarjeta` y no solo el predicado: al reabrir un delivery, sus líneas
          // ya cobradas vuelven a la lista y su venta_tarjeta YA existe. Registrarlas otra vez
          // crearía pendientes duplicados que después traban el cierre de caja.
          .filter(cd => esCobroTarjetaRegistrable(cd) && cd.requiereRegistroTarjeta)
          .map(cd => ({
            terminalPosId: cd.terminalPos?.id ?? null,
            proveedorServicioId: cd.terminalPos?.proveedorServicio?.id ?? null,
            monto: cd.valor,
            monedaId: cd.moneda?.id ?? null,
            terminalDescripcion: cd.terminalPos
              ? [cd.terminalPos.descripcion, cd.terminalPos.codigo].filter(Boolean).join(' - ')
              : undefined,
            datosCupon: cd.datosCupon,
          }))
      : [];
    this.cerrarConRespuesta(ventaCredito, itens, ticket, tarjetaPagos);
  }

  /**
   * Dispara el escaneo apenas se agrega una línea TARJETA — no al finalizar. Es lo que permite
   * mostrar el estado por línea (pendiente / registrada) en la tabla y ofrecer el ícono de QR
   * para reabrir. Si el flujo está deshabilitado, TARJETA queda como forma de pago normal.
   */
  private escanearSiEsTarjeta(item: CobroDetalle): void {
    if (!this.ventaTarjetaHabilitada) return;
    if (!esCobroTarjetaRegistrable(item)) return;
    this.escanearTarjeta(item);
  }

  /**
   * Elegir la terminal y, opcionalmente, leer el cupón — todo en memoria, sin tocar el backend.
   * Se puede volver a llamar para la misma línea (ícono QR de la tabla) tantas veces como haga
   * falta antes de Finalizar: siempre reemplaza lo que la línea ya tenía.
   */
  escanearTarjeta(item: CobroDetalle): void {
    this.matDialog.open(ScanTerminalPosDialogComponent, {
      width: '380px',
      disableClose: true,
      data: { terminalPos: item.terminalPos }
    }).afterClosed().pipe(untilDestroyed(this)).subscribe((result: ScanTerminalPosResult) => {
      if (!result?.terminalPos) return; // canceló la selección de terminal: la línea queda como estaba
      item.terminalPos = result.terminalPos;

      const data: EscanearCuponDialogData = {
        terminalDescripcion: [result.terminalPos.descripcion, result.terminalPos.codigo].filter(Boolean).join(' - '),
        proveedorServicioId: result.terminalPos.proveedorServicio?.id,
        monto: item.valor,
        // La moneda del COBRO, no la de la terminal: el monto que se muestra es el de esta línea.
        monedaCobroId: item.moneda?.id,
        monedaSimbolo: item.moneda?.simbolo,
        monedaTerminalId: result.terminalPos.moneda?.id,
        monedaTerminalSimbolo: result.terminalPos.moneda?.simbolo,
        decimalesPorMoneda: this.decimalesPorMoneda,
      };
      this.matDialog.open(EscanearCuponDialogComponent, { data, disableClose: false })
        .afterClosed()
        .pipe(untilDestroyed(this))
        .subscribe((datosCupon) => {
          if (!datosCupon) {
            // Pospuesto al reabrir: si la línea YA tenía un cupón bueno de un escaneo anterior,
            // no se pisa. "Más tarde" significa "no tengo nada nuevo que darte ahora", no
            // "olvidate lo que ya habías leído".
            this.notificacionSnackbar.notification$.next({
              color: NotificacionColor.warn,
              texto: 'Queda pendiente de registrar. Podés volver a escanearlo desde el ícono de QR en la lista.',
              duracion: 5,
            });
            return;
          }
          item.datosCupon = datosCupon;

          // El identificador viaja en el propio CobroDetalleInput de ESTA línea (toInput() ya lo
          // manda), así que el vínculo cobro↔cupón queda grabado con el saveVenta, exacto y sin
          // que nadie tenga que adivinarlo después.
          //
          // Esto es lo que cierra el caso de dos tarjetas del MISMO monto en una venta: el
          // backend no puede desempatarlas por monto, pero acá sabemos con certeza sobre qué
          // línea se escaneó, porque el diálogo se abrió parado en ella.
          item.identificadorTransaccion = datosCupon.identificadorTransaccion;

          const avisos: string[] = [];
          if (datosCupon.monto != null && datosCupon.monto !== item.valor) {
            avisos.push(`el cupón dice ${datosCupon.monto.toLocaleString('es-PY')} y se cobró ${item.valor.toLocaleString('es-PY')}`);
          }
          if (cuponVencido(datosCupon.fecha)) {
            avisos.push(`tiene más de ${HORAS_ANTIGUEDAD_MAXIMA} horas`);
          }
          this.notificacionSnackbar.notification$.next(avisos.length
            ? { color: NotificacionColor.warn, texto: `Cupón leído, pero ${avisos.join(' y ')}.`, duracion: 6 }
            : { color: NotificacionColor.success, texto: 'Cupón leído correctamente.', duracion: 2 }
          );
        });
    });
  }

  private cerrarConRespuesta(
    ventaCredito?: VentaCredito,
    itens?: VentaCreditoCuotaInput[],
    ticket?: boolean,
    tarjetaPagos: TarjetaPago[] = []
  ) {
    const response: PagoResponseData = {
      cobroDetalleList: this.cobroDetalleList,
      facturado: this.facturado,
      ventaCredito,
      itens,
      ticket,
      cliente: this.selectedCliente,
      tarjetaPagos,
      facturaLegalId: this.facturaLegalId,
    };
    this.dialogRef.close(response);
  }

  onDeleteItem(item: CobroDetalle, i) {
    if (item.id != null) {
      //quiere decir que esta guardado en la base de datos
      this.ventaService
        .onDeleteCobroDetalle(item.id, item.sucursalId, false)
        .subscribe((res) => {
          if (res) {
            // borrado con exito
            this.valorParcialPagado -= item.valor * item.moneda.cambio;
            this.formGroup.controls.saldo.setValue(
              this.data.valor - this.valorParcialPagado
            );
            this.formGroup.controls.valor.setValue(
              (this.data.valor - this.valorParcialPagado) /
              this.selectedMoneda.cambio
            );
            this.cobroDetalleList.splice(i, 1);
            this.setFocusToValorInput();
          }
        });
    } else {
      this.valorParcialPagado -= item.valor * item.moneda.cambio;
      this.formGroup.controls.saldo.setValue(
        this.data.valor - this.valorParcialPagado
      );
      this.formGroup.controls.valor.setValue(
        (this.data.valor - this.valorParcialPagado) / this.selectedMoneda.cambio
      );
      this.cobroDetalleList.splice(i, 1);
      this.setFocusToValorInput();
    }
  }

  onDescuento() {
    if (this.cobroDetalleList.some(item => item.descuento)) {
      this.notificacionSnackbar.openWarn("Ya se aplicó un descuento a esta venta.");
      return;
    }
    this.isDialogOpen = true;
    let valorCosto = 0;
    this.data.itemList.forEach((i) => {
      let costoTotal = 0;
      if (i?.precioCosto > 0) {
        costoTotal = i.precioCosto * i.cantidad;
      } else {
        costoTotal = i.precio * 0.85;
      }
      valorCosto += costoTotal;
    });
    let total = this.data.valor;
    let saldo = this.formGroup?.controls?.saldo?.value;

    let data: DescuentoDialogData = {
      valorTotal: total,
      cambioDs: this.cambioDs,
      cambioRs: this.cambioRs,
      saldo: saldo,
      costo: valorCosto,
    };
    this.matDialog
      .open(DescuentoDialogComponent, {
        data: data,
      })
      .afterClosed()
      .subscribe((res) => {
        this.isDialogOpen = false;
        if (res > 0) {
          this.isAumento = false;
          this.isVuelto = false;
          this.isDescuento = true;
          this.formGroup.controls.valor.setValue(res);
          this.addCobroDetalle(res);
        }
      });
  }

  onAumento() {
    let valor = this.formGroup.controls.valor.value;
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
    if (this.isDialogOpen) {
      // Evita abrir dos veces el diálogo de factura si el cajero toca el
      // botón repetidas veces antes de que se registre el primer click.
      return;
    }
    if (
      this.finalizarConFacturaHabilitado &&
      this.formGroup.controls.saldo.value != 0
    ) {
      this.notificacionSnackbar.openWarn(
        "Debe completar el pago antes de finalizar con factura"
      );
      return;
    }
    this.isDialogOpen = true;
    let venta = new Venta();
    let descuento = 0;
    this.cobroDetalleList?.forEach((c) => {
      if (c.descuento) {
        descuento += c.valor * c.moneda.cambio;
      }
      if (c.aumento) {
        descuento -= c.valor * c.moneda.cambio;
      }
    });
    venta.totalGs = this.formGroup.get("valorTotal").value;
    this.matDialog
      .open(AddFacturaLegalDialogComponent, {
        data: {
          venta,
          ventaItemList: this.data.itemList,
          descuento,
          ligarAVenta: this.finalizarConFacturaHabilitado,
        },
        width: "100%",
        height: "80vh",
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          this.facturado = res?.facturado;
          this.selectedCliente = res?.cliente;
          this.facturaLegalId = res?.facturaLegalId;
        }
        this.isDialogOpen = false;
        if (res?.facturado && this.finalizarConFacturaHabilitado) {
          this.onFinalizar();
          return;
        }
        setTimeout(() => {
          this.setFocusToValorInput();
        }, 0);
      });
  }

  onConvenioClick() {
    this.isDialogOpen = true;
    this.setFormaPago("CONVENIO");
    if (this.formGroup?.controls?.saldo?.value == 0) {
      return this.notificacionSnackbar.openWarn("El valor no puede ser 0.");
    } else if (this.formGroup?.controls?.saldo?.value < 0) {
      this.efectivoInput.onGetFocus();
      return this.notificacionSnackbar.openWarn(
        "El saldo es negativo, necesita dar vuelto"
      );
    } else {
      this.matDialog
        .open(AddVentaCreditoDialogComponent, {
          width: "100%",
          height: "80%",
          data: { valor: this.formGroup?.controls?.saldo?.value },
        })
        .afterClosed()
        .subscribe((res) => {
          if (res?.ventaCredito != null) {
            let ventaCredito: VentaCredito = res["ventaCredito"];
            let cobroDetalle = new CobroDetalle();
            cobroDetalle.pago = true;
            cobroDetalle.descuento = false;
            cobroDetalle.aumento = false;
            cobroDetalle.vuelto = false;
            cobroDetalle.formaPago = this.selectedFormaPago;
            cobroDetalle.moneda = this.monedas.find(
              (m) => m.denominacion == "GUARANI"
            );
            cobroDetalle.valor = this.formGroup?.controls?.saldo?.value;
            this.cobroDetalleList.push(cobroDetalle);
            this.facturado = !res?.factura;
            this.selectedCliente = ventaCredito.cliente;
            console.log(ventaCredito, res["itens"]);
            this.onFinalizar(ventaCredito, res["itens"]);
          } else {
            this.setFormaPago(this.formaPagoList[0].descripcion)
          }
        });
    }
  }

  onFirmaClick() {
    this.isDialogOpen = true;
    this.setFormaPago("FIRMA");
    this.matDialog
      .open(AddVentaCreditoDialogComponent, {
        width: "100%",
        height: "80%",
        data: { valor: this.formGroup?.controls?.saldo?.value },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res["ventaCredito"] != null) {
          let ventaCredito: VentaCredito = res["ventaCredito"];
          let cobroDetalle = new CobroDetalle();
          cobroDetalle.pago = true;
          cobroDetalle.descuento = false;
          cobroDetalle.aumento = false;
          cobroDetalle.vuelto = false;
          cobroDetalle.formaPago = this.selectedFormaPago;
          cobroDetalle.moneda = this.monedas.find(
            (m) => m.denominacion == "GUARANI"
          );
          cobroDetalle.valor = this.formGroup?.controls?.saldo?.value;
          this.cobroDetalleList.push(cobroDetalle);
          this.onFinalizar(ventaCredito, res["itens"]);
        }
      });
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.formaPagoSub.unsubscribe();
  }

  onValorEnter() {
    if (!this.isDialogOpen) {
      if (this.formGroup.controls.saldo.value == 0) {
        this.onFinalizar(null, null, false);
      } else {
        this.addCobroDetalle();
      }
    }
  }
}
