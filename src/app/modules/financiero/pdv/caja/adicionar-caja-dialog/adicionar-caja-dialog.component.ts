import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  Input,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { forkJoin, Observable, of, Subject } from "rxjs";
import { catchError, defaultIfEmpty, finalize, map, take } from "rxjs/operators";
import {
  ContextoConsulta,
  PROPAGAR_ERROR_DE_RED,
  TIMEOUT_CONSULTA_DE_FONDO_MS,
  TIMEOUT_CONSULTA_MOSTRADOR_MS,
} from "../../../../../generics/generic-crud.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../../../notificacion-snackbar.service";
import { CargandoDialogService } from "../../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { AdicionarConteoResponse } from "../../../conteo/adicionar-conteo-dialog/adicionar-conteo-dialog.component";
import { ConteoMoneda } from "../../../conteo/conteo-moneda/conteo-moneda.model";
import { Conteo } from "../../../conteo/conteo.model";
import { AdicionarMaletinDialogComponent } from "../../../maletin/adicionar-maletin-dialog/adicionar-maletin-dialog.component";
import { Maletin } from "../../../maletin/maletin.model";
import { MaletinService } from "../../../maletin/maletin.service";
import { ConfirmDialogComponent } from "../../../../../shared/components/confirm-dialog/confirm-dialog.component";
import { PdvCaja, PdvCajaInput } from "../caja.model";
import { CajaService } from "../caja.service";

export class AdicionarCajaData {
  caja?: PdvCaja;
  isVentaTouch?: boolean;
}

export interface AdicionarCajaResponse {
  caja?: PdvCaja;
  conteoApertura?: Conteo;
  conteoCierre?: Conteo;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MainService } from "../../../../../main.service";
import { FacturaLegalService } from "../../../factura-legal/factura-legal.service";
import { DeliveryService } from "../../../../pdv/comercial/venta-touch/delivery-dialog/delivery.service";
import { DeliveryEstado } from "../../../../operaciones/delivery/enums";
import { Delivery } from "../../../../operaciones/delivery/delivery.model";
import { Tab } from "../../../../../layouts/tab/tab.model";
import { TransferirCajaDialogComponent } from "../transferir-caja-dialog/transferir-caja-dialog.component";
import { TabService, TabData } from "../../../../../layouts/tab/tab.service";
import { ListGastosComponent } from "../../../gastos/pages/list-gastos/list-gastos.component";
import { ListRetiroComponent } from "../../../retiro/list-retiro/list-retiro.component";
import { ROLES } from "../../../../personas/roles/roles.enum";
import {
  MotivoNoConciliarDialogComponent,
  MotivoNoConciliarResultado,
} from "../../../venta-tarjeta/motivo-no-conciliar-dialog/motivo-no-conciliar-dialog.component";
import { ListVentaComponent } from "../../../../operaciones/venta/list-venta/list-venta.component";
import { GastoService } from "../../../gastos/service/gasto.service";
import { VentaTarjetaService } from "../../../venta-tarjeta/venta-tarjeta.service";
import { MonedaService } from "../../../moneda/moneda.service";
import { NotificationHttpService } from "../../../../../shared/services/notification-http.service";

@UntilDestroy()
@Component({
  selector: "app-adicionar-caja-dialog",
  templateUrl: "./adicionar-caja-dialog.component.html",
  styleUrls: ["./adicionar-caja-dialog.component.scss"],
})
export class AdicionarCajaDialogComponent implements OnInit {

  @Input()
  data: Tab;

  ROLES = ROLES;

  @ViewChild("stepper", { static: false }) stepper: MatStepper;
  @ViewChild("codigoMaletinInput", { static: false })
  codigoMaletinInput: ElementRef;

  @ViewChild("siguienteBtn", { static: false })


  siguienteBtn: MatButton;

  conetoMonedaList: ConteoMoneda[];

  siguienteSubject: Subject<number> = new Subject<number>();
  siguienteCierreSubject: Subject<number> = new Subject<number>();
  conteoAperturaSubject: Subject<Conteo> = new Subject<Conteo>();
  conteoCierreSubject: Subject<Conteo> = new Subject<Conteo>();
  focusToAPerturaSub: Subject<any> = new Subject<any>();
  focusToCierreSub: Subject<any> = new Subject<any>();

  formGroup: FormGroup;
  isVerificado = false;

  descripcionMaletinControl = new FormControl(null, Validators.required);

  idControl = new FormControl();
  observacionControl = new FormControl(null);
  activoControl = new FormControl(true);
  estadoControl = new FormControl(true);
  fechaAperturaControl = new FormControl();
  fechaCierreControl = new FormControl();
  creadoEnControl = new FormControl();
  conteoAperturaControl = new FormControl();
  conteoCierreControl = new FormControl();
  usuarioControl = new FormControl();
  maletinControl = new FormControl(null, Validators.required);
  selectedCaja: PdvCaja;
  selectedMaletin: Maletin;
  selectedConteoApertura: Conteo;
  selectedConteoCierre: Conteo;

  totalGsAper = 0;
  totalRsaper = 0;
  totalDsAper = 0;
  totalGsCierre = 0;
  totalRsCierre = 0;
  totalDsCierre = 0;

  conteoInicial = true;

  isCierre = false;

  /** Habilita la correccion de montos en los conteos: solo ADMIN y sobre cajas no verificadas. */
  puedeEditarConteos = false;

  /** Ignora un segundo «Conteo Cierre» mientras se verifica el primero. */
  private verificandoCierre = false;

  verificarMaletinTimeout = null;

  isTab = false;

  isVentaTouch = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data2: AdicionarCajaData,
    private matDialogRef: MatDialogRef<AdicionarCajaDialogComponent>,
    private cajaService: CajaService,
    private maletinService: MaletinService,
    private notificacionBar: NotificacionSnackbarService,
    private cargandoDialog: CargandoDialogService,
    private matDialog: MatDialog,
    private deliveryService: DeliveryService,
    private gastoService: GastoService,
    private tabService: TabService,
    public mainService: MainService,
    private ventaTarjetaService: VentaTarjetaService,
    private monedaService: MonedaService,
    private notificationHttpService: NotificationHttpService
  ) {

  }

  ngOnInit(): void {
    this.idControl.disable();
    this.creadoEnControl.disable();
    this.usuarioControl.disable();

    if (this.data != null) this.isTab = true;

    if (this.data2?.isVentaTouch != null) this.isVentaTouch = this.data2?.isVentaTouch;

    let auxData: PdvCaja = this.data2?.caja != null ? this.data2?.caja : (this.data?.tabData?.data != null ? this.data?.tabData?.data : null);
    if (auxData != null) {
      this.cajaService
        .onGetById(auxData?.id, auxData.sucursalId, null, !this.isVentaTouch)
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res != null) {
            this.selectedCaja = res;
            this.isCierre = this.selectedCaja?.conteoCierre != null;
            // Una caja verificada queda congelada: ni el ADMIN puede corregir sus montos.
            this.puedeEditarConteos =
              (this.mainService.usuarioActual?.roles?.includes(ROLES.ADMIN) || false) &&
              this.selectedCaja?.verificado !== true;
            this.cargarDatos();

            const targetSection = this.data?.tabData?.goToSection;
            if (targetSection) {
              console.log('Navegando automáticamente a:', targetSection);
              setTimeout(() => {
                this.goTo(targetSection);
              }, 1000);
            }

            // Deliverys, solicitudes y tarjetas se verifican al tocar «Conteo Cierre», no acá: un
            // chequeo que no respondía al abrir dejaba su flag en false y el cierre pasaba (#390).
          }
        });
    } else {
    }

    setTimeout(() => {
      this.codigoMaletinInput.nativeElement.focus();
    }, 1000);
  }

  /**
   * El alta de la caja falló o quedó sin respuesta, pero la caja pudo haberse creado (o existir de un intento
   * anterior): el filial rechaza una segunda caja abierta del mismo usuario, así que volver a elegir el maletín
   * dejaba al cajero trabado. Si su caja abierta es la de este maletín y todavía no tiene apertura, se sigue
   * con esa. Solo en el PDV (contra el filial), que es donde se crean cajas desde acá.
   */
  private adoptarCajaAbiertaOVolverAlMaletin(): void {
    const maletin = this.selectedMaletin;
    const usuarioId = this.mainService.usuarioActual?.id;
    if (!this.isVentaTouch || maletin?.id == null || usuarioId == null) {
      this.volverAlMaletin();
      return;
    }
    this.cajaService.onGetAbiertaDelUsuario(usuarioId, false)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (caja) => {
          if (caja?.id == null) {
            this.volverAlMaletin();
            return;
          }
          const esLaDeEsteIntento = caja.maletin?.id == maletin.id && caja.conteoApertura == null
            && caja.fechaCierre == null;
          if (!esLaDeEsteIntento) {
            this.volverAlMaletin(`Ya tenés otra caja abierta (#${caja.id}): revisala antes de abrir una nueva.`);
            return;
          }
          this.selectedCaja = caja;
          this.cajaService.selectedCaja = caja;
          this.notificacionBar.openWarn(`La caja ya había quedado abierta (#${caja.id}): se continúa con esa.`, 6);
        },
        error: () => this.volverAlMaletin(
          'No se pudo verificar si la caja quedó abierta: revisá la lista de cajas antes de abrir otra.'),
      });
  }

  private volverAlMaletin(aviso?: string): void {
    this.selectedMaletin = null;
    this.descripcionMaletinControl.setValue(null);
    this.goTo("maletin");
    if (aviso) this.notificacionBar.openWarn(aviso, 8);
  }

  // cargarMonedas() {
  //   this.monedaService.onGetAll().subscribe((res) => {
  //     if (res != null) {
  //       let monedaList: Moneda[] = res;
  //       monedaList.forEach((m) => {
  //         switch (m.denominacion) {
  //           case "GUARANI":
  //             this.guaraniList = m.monedaBilleteList;
  //             break;
  //           case "REAL":
  //             this.realList = m.monedaBilleteList;
  //             break;
  //           case "DOLAR":
  //             this.dolarList = m.monedaBilleteList;
  //             break;
  //           default:
  //             break;
  //         }
  //       });
  //       console.log(res)
  //     }
  //   });
  // }

  cargarDatos() {
    if (this.selectedCaja?.maletin != null)
      this.maletinService
        .onGetPorId(this.selectedCaja?.maletin?.id, this.selectedCaja.sucursal.id, !this.isVentaTouch,
          PROPAGAR_ERROR_DE_RED, { timeoutMs: TIMEOUT_CONSULTA_MOSTRADOR_MS, silenciarAvisoTimeout: true })
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res) => {
            if (res != null) {
              this.selectedMaletin = res;
              this.descripcionMaletinControl.setValue(
                this.selectedMaletin.descripcion
              );
              this.descripcionMaletinControl.disable();
            }
          },
          // Sin respuesta el campo del maletín quedaba vacío sin aviso (#390).
          error: () => this.notificacionBar.notification$.next({
            texto: "No se pudo cargar el maletín de la caja: el servidor no responde.",
            color: NotificacionColor.warn,
            duracion: 5,
          })
        });
    if (this.selectedCaja?.conteoApertura != null) {
      this.selectedConteoApertura = this.selectedCaja.conteoApertura;
      this.conteoAperturaSubject.next(this.selectedConteoApertura);
    }
    if (this.selectedCaja?.conteoCierre != null) {
      this.selectedConteoCierre = this.selectedCaja.conteoCierre;
      this.conteoCierreSubject.next(this.selectedConteoCierre);
    }
    this.idControl.setValue(this.selectedCaja.id);
    this.observacionControl.setValue(this.selectedCaja.descripcion);
    this.fechaAperturaControl.setValue(this.selectedCaja.fechaApertura);
    this.fechaCierreControl.setValue(this.selectedCaja.fechaCierre);
    this.conteoAperturaControl.setValue(this.selectedCaja.conteoApertura);
    this.conteoCierreControl.setValue(this.selectedCaja.conteoCierre);
    this.activoControl.setValue(this.selectedCaja.activo);
    this.creadoEnControl.setValue(this.selectedCaja.creadoEn);
    this.usuarioControl.setValue(this.selectedCaja.usuario.persona.nombre);
    this.siguienteSubject.next(1);
    this.siguienteCierreSubject.next(1);
  }

  onCancel() {
    let res: AdicionarCajaResponse = {
      caja: this.selectedCaja,
      conteoApertura: this.selectedConteoApertura,
      conteoCierre: this.selectedConteoCierre,
    };
    this.matDialogRef.close(res);
  }

  verificarMaletin() {
    if (this.verificarMaletinTimeout == null) {
      this.verificarMaletinTimeout = setTimeout(() => {
        this.maletinService
          .onGetPorDescripcion(this.descripcionMaletinControl.value, !this.isVentaTouch, PROPAGAR_ERROR_DE_RED)
          .pipe(untilDestroyed(this))
          .subscribe({
            // Sin respuesta el clic de verificar quedaba mudo (el maletín no se verifica: no se abre con él) (#390).
            error: () => this.notificacionBar.notification$.next({
              texto: "No se pudo verificar el maletín: el servidor no responde. Intentá de nuevo.",
              color: NotificacionColor.warn,
              duracion: 5,
            }),
            next: (res) => {
              if (res != null) {
                let maletinEncontrado: Maletin = res;
                if (maletinEncontrado.abierto == true) {
                  this.notificacionBar.notification$.next({
                    texto: "Este maletin ya esta siendo utilizado",
                    color: NotificacionColor.warn,
                    duracion: 3,
                  });
                  this.seleccionarMaletin(null);
                } else {
                  this.notificacionBar.notification$.next({
                    texto: "Maletin verificado correctamente",
                    color: NotificacionColor.success,
                    duracion: 2,
                  });
                  this.seleccionarMaletin(maletinEncontrado);
                }
              } else {
                this.notificacionBar.notification$.next({
                  texto: "No existe un maletin registrado con ese código",
                  color: NotificacionColor.danger,
                  duracion: 3,
                });
                this.seleccionarMaletin(null);
              }
            }
          });
        clearTimeout(this.verificarMaletinTimeout)
        this.verificarMaletinTimeout = null;
      }, 1000);
    }
  }

  sinMaletin() {
    this.matDialog
      .open(AdicionarMaletinDialogComponent, {
        width: "50%",
        autoFocus: true,
        restoreFocus: true,
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          this.notificacionBar.notification$.next({
            texto: "Maletin verificado correctamente",
            color: NotificacionColor.success,
            duracion: 2,
          });
          this.seleccionarMaletin(res);
        }
      });
  }

  seleccionarMaletin(maletin: Maletin) {
    if (maletin != null) {
      this.descripcionMaletinControl.setValue(maletin.descripcion);
      this.selectedMaletin = maletin;
      this.crearNuevaCaja();
      this.stepper.next();
      setTimeout(() => {
        this.siguienteSubject.next(0);
      }, 0);
    } else {
      this.descripcionMaletinControl.setValue(null);
    }
  }

  onSiguiente() {
    switch (this.stepper.selectedIndex) {
      case 0:
        this.stepper.next();
        let dialog = this.cargandoDialog.openDialog();
        setTimeout(() => {
          // this.gs500Input.nativeElement.focus()
          this.cargandoDialog.closeDialog(dialog.requestId);
        }, 500);
        this.siguienteSubject.next(0);
        break;
      case 1:
        this.siguienteSubject.next(1);
        break;

      case 2:
        break;

      default:
        break;
    }
  }

  getConteoMoneda(response: AdicionarConteoResponse) {
    this.totalGsAper = +response.totalGs;
    this.totalRsaper = +response.totalRs;
    this.totalDsAper = +response.totalDs;
    if (response.apertura) {
      this.selectedConteoApertura = response.conteo;
      this.verificarDiferenciaMaletinEnApertura();
    } else {
      this.selectedConteoCierre = response.conteo;
    }
  }

  getConteoMonedaCierre(response: AdicionarConteoResponse) {
    this.totalGsCierre = +response.totalGs;
    this.totalRsCierre = +response.totalRs;
    this.totalDsCierre = +response.totalDs;
    if (response.apertura) {
      this.selectedConteoApertura = response.conteo;
    } else {
      this.selectedConteoCierre = response.conteo;
      if (!this.isCierre) {
        this.goTo("imprimir");
        this.isCierre = true;
      }
    }
  }

  // La "diferencia en maletín" es el faltante/sobrante físico del maletín entre
  // el cierre de la caja ANTERIOR que lo usó y la apertura de esta caja nueva.
  // Es el MISMO cálculo que analisis-diferencia.component.ts (calculateMontos /
  // calculateTotalesByConteo sobre conteoMonedaList sumando cantidad*valor por
  // moneda) -- NO es CajaBalance.diferenciaGs, que es la reconciliación interna
  // de ESTA caja contra sus propias ventas/gastos/retiros, un dato distinto.
  // El dato solo existe una vez que la apertura de la caja nueva se contó, por
  // eso se dispara acá y no en el cierre.
  private diferenciaMaletinAperturaVerificada = false;

  private verificarDiferenciaMaletinEnApertura() {
    if (this.diferenciaMaletinAperturaVerificada) return;
    if (!this.selectedCaja?.id || !this.selectedCaja?.sucursal?.id || !this.selectedMaletin?.id) return;
    this.diferenciaMaletinAperturaVerificada = true;

    this.pollCajaActualParaDiferenciaMaletin(0);
  }

  // cajasAnalisisDiferencias enriquece cajaAnteriorId/conteoApertura recién
  // cuando esta caja replicó de filial a central -> se reintenta hasta que el
  // conteoApertura que devuelve central coincide con lo efectivamente contado.
  private pollCajaActualParaDiferenciaMaletin(intento: number) {
    const MAX_INTENTOS = 15;
    const INTERVALO_MS = 2000;

    this.cajaService
      .onGetCajasAnalisisDiferencias(
        this.selectedCaja.id, null, null, null, null, null, null, null,
        this.selectedCaja.sucursal.id, null, 0, 1, null, true
      )
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response: any) => {
          const cajaActual = response?.getContent?.[0] || response?.data?.getContent?.[0];
          if (cajaActual && this.aperturaReplicada(cajaActual)) {
            this.buscarCajaAnteriorYNotificar(cajaActual);
          } else if (intento < MAX_INTENTOS) {
            setTimeout(() => this.pollCajaActualParaDiferenciaMaletin(intento + 1), INTERVALO_MS);
          } else {
            console.warn("No se pudo confirmar la replicación de la apertura para verificar diferencia de maletín.");
          }
        },
        error: (err) => {
          if (intento < MAX_INTENTOS) {
            setTimeout(() => this.pollCajaActualParaDiferenciaMaletin(intento + 1), INTERVALO_MS);
          } else {
            console.error("Error al verificar diferencia en maletín:", err);
          }
        }
      });
  }

  private aperturaReplicada(cajaActual: any): boolean {
    if (!cajaActual.conteoApertura) return false;
    const apertura = this.calculateTotalesByConteo(cajaActual.conteoApertura);
    const EPSILON = 0.01;
    return Math.abs(apertura.gs - this.totalGsAper) < EPSILON
      && Math.abs(apertura.rs - this.totalRsaper) < EPSILON
      && Math.abs(apertura.ds - this.totalDsAper) < EPSILON;
  }

  private buscarCajaAnteriorYNotificar(cajaActual: any) {
    const cajaAnteriorId = cajaActual.cajaAnteriorId;
    if (!cajaAnteriorId) return; // primer uso del maletín, no hay con qué comparar

    this.cajaService
      .onGetByIdSimp(cajaAnteriorId, this.selectedCaja.sucursal.id, true)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (cajaAnterior) => {
          if (!cajaAnterior?.conteoCierre) return;

          const cierreAnterior = this.calculateTotalesByConteo(cajaAnterior.conteoCierre);
          const aperturaActual = this.calculateTotalesByConteo(cajaActual.conteoApertura);

          const diferenciaGs = cierreAnterior.gs - aperturaActual.gs;
          const diferenciaRs = cierreAnterior.rs - aperturaActual.rs;
          const diferenciaDs = cierreAnterior.ds - aperturaActual.ds;

          this.evaluarYNotificarDiferenciaMaletin(diferenciaGs, diferenciaRs, diferenciaDs);
        },
        error: (err) => console.error("Error al obtener la caja anterior del maletín:", err)
      });
  }

  // Idéntico a analisis-diferencia.component.ts#calculateTotalesByConteo.
  private calculateTotalesByConteo(conteo: any): { gs: number; rs: number; ds: number } {
    const totales = { gs: 0, rs: 0, ds: 0 };
    if (!conteo) return totales;

    if (conteo.conteoMonedaList && conteo.conteoMonedaList.length > 0) {
      conteo.conteoMonedaList.forEach((conteoMoneda: any) => {
        const denominacion = conteoMoneda.monedaBilletes?.moneda?.denominacion;
        const cantidad = conteoMoneda.cantidad || 0;
        const valor = conteoMoneda.monedaBilletes?.valor || 0;
        const total = cantidad * valor;
        switch (denominacion) {
          case "GUARANI":
            totales.gs += total;
            break;
          case "REAL":
            totales.rs += total;
            break;
          case "DOLAR":
            totales.ds += total;
            break;
        }
      });
      return totales;
    }

    if (conteo.totalGs != null || conteo.totalRs != null || conteo.totalDs != null) {
      totales.gs = conteo.totalGs || 0;
      totales.rs = conteo.totalRs || 0;
      totales.ds = conteo.totalDs || 0;
    }
    return totales;
  }

  private evaluarYNotificarDiferenciaMaletin(diferenciaGs: number, diferenciaRs: number, diferenciaDs: number) {
    this.monedaService
      .onGetAll()
      .pipe(take(1))
      .subscribe((monedas) => {
        const cotizacionReal = monedas?.find((m) => m.denominacion === "REAL")?.cambio || 130;
        const cotizacionDolar = monedas?.find((m) => m.denominacion === "DOLAR")?.cambio || 7000;

        const diferenciaTotalGs =
          Math.abs(diferenciaGs) +
          Math.abs(diferenciaRs) * cotizacionReal +
          Math.abs(diferenciaDs) * cotizacionDolar;

        const UMBRAL_NOTIFICACION_DIFERENCIA = 20000;

        if (diferenciaTotalGs > UMBRAL_NOTIFICACION_DIFERENCIA) {
          this.notificationHttpService
            .sendDiferenciaMaletinNotification(
              this.selectedCaja.id,
              this.selectedCaja.sucursal.id,
              diferenciaTotalGs,
              diferenciaGs,
              diferenciaRs,
              diferenciaDs,
              this.selectedMaletin?.descripcion,
              this.selectedCaja.sucursal.nombre
            )
            .subscribe({
              error: (err) => console.error("Error al enviar notificación de diferencia en maletín:", err)
            });
        }
      });
  }

  onAnterior() {
    this.stepper.previous();
  }

  @HostListener("document:keydown", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case "F10":
        switch (this.stepper.selectedIndex) {
          case 0:
            break;
          case 1:
            this.onSiguiente();

            break;

          default:
            break;
        }
        break;
      case "Enter":
        break;
      default:
        break;
    }
  }

  goTo(opcion) {
    switch (opcion) {
      case "maletin":
        this.stepper.selectedIndex = 0;
        break;
      case "apertura":
        this.stepper.selectedIndex = 1;
        this.focusToAPerturaSub.next(null);
        break;
      case "cierre":
        this.verificarCierre();
        break;
      case "imprimir":
        if (this.selectedCaja != null) {
          this.cajaService.onImprimirBalance(
            this.selectedCaja?.id,
            this.selectedCaja?.sucursalId,
            !this.isVentaTouch
          ).subscribe({
            next: (response) => {
              // TODO: Implement success notification if needed
              console.log('Balance impreso:', response);
            },
            error: (err) => {
              // TODO: Implement error notification if needed
              console.error('Error al imprimir balance:', err);
            }
          });
        }
        break;
      case "imprimir-factura":
        if (this.selectedCaja != null)
          // this.facturaService.onImprimirFacturasPorCaja(this.selectedCaja?.id);
          break;
      case "salir":
        this.matDialogRef.close();
        break;
      default:
        break;
    }
  }
  /**
   * Verifica en el momento lo que impide cerrar (#390). Política mixta:
   * - el servidor local no responde (deliverys en el POS, tarjetas) → no avanza: sin él tampoco se
   *   guarda el cierre;
   * - el central no responde (solicitudes de gasto) o algún servidor devolvió error → pregunta si cerrar
   *   igual, para que una filial sin internet o desactualizada no quede trabada para siempre.
   */
  private verificarCierre(): void {
    if (this.verificandoCierre || this.selectedCaja == null) return;
    this.verificandoCierre = true;
    const caja = this.selectedCaja;
    // Fuera del POS el diálogo habla con el central: más margen.
    const contextoLocal: ContextoConsulta = {
      timeoutMs: this.isVentaTouch ? TIMEOUT_CONSULTA_MOSTRADOR_MS : TIMEOUT_CONSULTA_DE_FONDO_MS,
      silenciarAvisoTimeout: true,
    };
    const contextoCentral: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
    const { requestId } = this.cargandoDialog.openDialog(false, "Verificando el cierre...");

    forkJoin({
      deliverys: this.chequeo(
        this.deliveryService.onDeliveryPorCajaIdAndEstado(
          caja.id,
          [DeliveryEstado.ABIERTO, DeliveryEstado.EN_CAMINO, DeliveryEstado.PARA_ENTREGA],
          caja.sucursal?.id,
          !this.isVentaTouch,
          PROPAGAR_ERROR_DE_RED,
          this.isVentaTouch ? contextoLocal : contextoCentral,
          true
        )
      ),
      solicitudes: this.chequeo(
        this.gastoService.preGastoFilter(
          undefined, caja.id, undefined, undefined, undefined, 0, 1, ["PENDIENTE", "AUTORIZADO"],
          true, PROPAGAR_ERROR_DE_RED, contextoCentral
        )
      ),
      tarjetas: this.chequeo(this.ventaTarjetaService.onCountSinRegistrar(caja.id, caja.sucursalId, contextoLocal)),
    })
      .pipe(
        untilDestroyed(this),
        finalize(() => {
          this.verificandoCierre = false;
          this.cargandoDialog.closeDialog(requestId);
        })
      )
      .subscribe((r) => this.decidirCierre(r));
  }

  /** Un error GraphQL llega como null: se distingue de "no respondió". */
  private chequeo<T>(obs: Observable<T>): Observable<ChequeoCierre<T>> {
    const sinRespuesta: ChequeoCierre<T> = { estado: "sin-respuesta" };
    return obs.pipe(
      take(1),
      map((valor): ChequeoCierre<T> => (valor == null ? { estado: "error" } : { estado: "ok", valor })),
      catchError(() => of(sinRespuesta)),
      defaultIfEmpty(sinRespuesta)
    );
  }

  private decidirCierre(r: ResultadoCierre): void {
    const localSinRespuesta =
      r.tarjetas.estado === "sin-respuesta" || (this.isVentaTouch && r.deliverys.estado === "sin-respuesta");
    if (localSinRespuesta) {
      this.notificacionBar.openWarn(
        "No se pudo verificar el cierre: el servidor local no responde. Intente nuevamente.",
        4
      );
      return;
    }

    const noVerificado: string[] = [];
    if (r.deliverys.estado !== "ok") noVerificado.push("los deliverys abiertos");
    if (r.solicitudes.estado !== "ok") noVerificado.push("las solicitudes de gasto pendientes");
    if (r.tarjetas.estado !== "ok") noVerificado.push("las ventas con tarjeta sin registrar");
    if (noVerificado.length === 0) {
      this.evaluarCierre(r);
      return;
    }
    this.matDialog
      .open(ConfirmDialogComponent, {
        width: "480px",
        data: {
          title: "No se pudo verificar todo",
          message: `No se pudo verificar ${noVerificado.join(", ")}: el servidor no respondió o devolvió un error. ¿Cerrar la caja igual?`,
          confirmText: "Cerrar igual",
          cancelText: "Volver",
        },
      })
      .afterClosed()
      .pipe(take(1), untilDestroyed(this))
      .subscribe((cerrarIgual) => {
        if (cerrarIgual === true) this.evaluarCierre(r);
      });
  }

  /** Con lo que sí se pudo verificar, el mismo orden de antes. */
  private evaluarCierre(r: ResultadoCierre): void {
    if (r.deliverys.estado === "ok" && r.deliverys.valor.length > 0) {
      this.notificacionBar.openWarn("Posee deliverys sin concluir");
      return;
    }
    const solicitudes = r.solicitudes.estado === "ok" ? r.solicitudes.valor : null;
    if ((solicitudes?.getNumberOfElements ?? 0) > 0 || (solicitudes?.getContent?.length ?? 0) > 0) {
      this.notificacionBar.openWarn("Posee solicitudes en estado pendiente o autorizado");
      return;
    }
    if (r.tarjetas.estado === "ok" && r.tarjetas.valor > 0) {
      this.resolverTarjetasPendientes(r.tarjetas.valor);
      return;
    }
    if (r.tarjetas.estado === "error") {
      // El filial respondió con error al contarlas y el cajero eligió cerrar igual: puede haber
      // pendientes, así que pasa por el mismo motivo auditable que si las hubiera contado.
      this.pedirMotivoYMarcarNoCompletadas(null);
      return;
    }
    this.irAlCierre();
  }

  private resolverTarjetasPendientes(pendientes: number): void {
    // El pendiente de tarjeta NO deja pasar de largo, pero tampoco traba la caja.
    //
    // Historia corta: primero fue una advertencia con "Cerrar igualmente" a mano del
    // cajero, y ese escape convertia cada venta sin registrar en un NO COMPLETADO
    // silencioso --plata cobrada con tarjeta que despues no se puede conciliar contra
    // la liquidacion del proveedor. Entonces se cerro del todo, y quedo el problema
    // opuesto: el cupon que no se imprimio o el POS que fallo dejaban la caja trabada
    // de noche esperando a un supervisor que no estaba.
    //
    // Lo que cambia ahora no es quien puede, sino que queda: el cajero sale, pero
    // tiene que decir POR QUE, y eso se guarda con su usuario y la hora en cada fila
    // (venta_tarjeta.no_completado_*). La decision deja de evaporarse.
    this.matDialog.open(ConfirmDialogComponent, {
      width: "520px",
      data: {
        title: "Ventas con tarjeta sin registrar",
        message: `Posee ${pendientes} venta(s) con tarjeta sin registrar. ` +
          `Registralas escaneando el QR del cupón desde el PDV o desde el celular. ` +
          `Si el cupón no existe --no se imprimió, falló la terminal, se perdió-- ` +
          `podés dejarlas sin conciliar diciendo por qué: queda registrado con tu ` +
          `usuario para que se pueda revisar después.`,
        confirmText: "Dejar sin conciliar",
        cancelText: "Volver a registrarlas",
      },
    }).afterClosed().pipe(take(1)).subscribe((quiereForzar) => {
      if (quiereForzar !== true) return;
      this.pedirMotivoYMarcarNoCompletadas(pendientes);
    });
  }

  /** @param pendientes null si no se pudieron contar (error del servidor al verificar el cierre). */
  private pedirMotivoYMarcarNoCompletadas(pendientes: number | null): void {
    this.matDialog.open(MotivoNoConciliarDialogComponent, {
      width: "460px",
      disableClose: true,
      data: { cuantos: pendientes },
    }).afterClosed().pipe(take(1)).subscribe((res: MotivoNoConciliarResultado) => {
      // Sin motivo no se marca nada: es la condicion de que esto sea auditable y
      // no un "cerrar igualmente" con otro nombre.
      if (!res?.motivo) return;
      this.ventaTarjetaService.onMarcarNoCompletadas(
        this.selectedCaja.id,
        this.selectedCaja.sucursalId,
        res.motivo,
        res.observacion,
        this.mainService.usuarioActual?.id
      )
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.irAlCierre();
          },
          error: () => {
            this.notificacionBar.openWarn(
              "No se pudo actualizar las ventas con tarjeta pendientes. Intente nuevamente."
            );
          },
        });
    });
  }

  private irAlCierre(): void {
    this.stepper.selectedIndex = 1;
    this.stepper.selectedIndex = 2;
    this.focusToCierreSub.next(null);
  }


  crearNuevaCaja() {
    setTimeout(() => {
      let pdvCaja = new PdvCaja();
      pdvCaja.maletin = this.selectedMaletin;
      pdvCaja.activo = true;
      this.cajaService
        .onSave(pdvCaja.toInput(), !this.isVentaTouch)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res) => {
            if (res != null) {
              this.selectedCaja = res;
              this.cajaService.selectedCaja = this.selectedCaja;
            }
          },
          // El stepper ya avanzó a la apertura sin caja. El aviso del error lo da el genérico (#390).
          error: () => this.adoptarCajaAbiertaOVolverAlMaletin(),
        });
    }, 1000);
  }

  transferirCaja() {
    this.matDialog.open(TransferirCajaDialogComponent, {
      data: {
        cajaId: this.selectedCaja.id
      },
      width: '500px'
    }).afterClosed().subscribe(res => {
      if (res) {
        this.matDialogRef.close();
      }
    });
  }

  onIrAGastos() {
    if (this.selectedCaja != null) {
      this.tabService.addTab(
        new Tab(
          ListGastosComponent,
          "Gastos de la caja " + this.selectedCaja.id,
          new TabData(null, { caja: this.selectedCaja, sucursal: this.selectedCaja.sucursal }),
          AdicionarCajaDialogComponent
        )
      );
      this.matDialogRef.close();
    }
  }

  onIrARetiros() {
    if (this.selectedCaja != null) {
      this.tabService.addTab(
        new Tab(
          ListRetiroComponent,
          "Retiros de la caja " + this.selectedCaja.id,
          new TabData(null, { caja: this.selectedCaja, sucursal: this.selectedCaja.sucursal }),
          AdicionarCajaDialogComponent
        )
      );
      this.matDialogRef.close();
    }
  }

  onIrAVentas() {
    if (this.selectedCaja != null) {
      this.tabService.addTab(
        new Tab(
          ListVentaComponent,
          "Ventas de la caja " + this.selectedCaja.id,
          new TabData(null, { caja: this.selectedCaja, sucursal: this.selectedCaja.sucursal }),
          AdicionarCajaDialogComponent
        )
      );
      this.matDialogRef.close();
    }
  }
}

/** Resultado de cada consulta que verifica el cierre (#390). */
interface ResultadoCierre {
  deliverys: ChequeoCierre<Delivery[]>;
  solicitudes: ChequeoCierre<any>;
  tarjetas: ChequeoCierre<number>;
}
type ChequeoCierre<T> = { estado: "ok"; valor: T } | { estado: "sin-respuesta" } | { estado: "error" };
