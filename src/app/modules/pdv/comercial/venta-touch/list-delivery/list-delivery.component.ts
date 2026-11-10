import { SelectionModel } from "@angular/cdk/collections";
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { UntilDestroy } from "@ngneat/until-destroy";
import { BehaviorSubject, EMPTY } from "rxjs";
import { catchError, map } from "rxjs/operators";
import {
  PROPAGAR_ERROR_DE_RED,
  TIMEOUT_CONSULTA_DE_FONDO_MS,
  TIMEOUT_CONSULTA_MOSTRADOR_MS,
} from "../../../../../generics/generic-crud.constantes";
import { NotificacionSnackbarService } from "../../../../../notificacion-snackbar.service";
import {
  updateDataSource,
  updateDataSourceWithId,
} from "../../../../../commons/core/utils/numbersUtils";
import { BotonComponent } from "../../../../../shared/components/boton/boton.component";
import { FormaPago } from "../../../../financiero/forma-pago/forma-pago.model";
import { Moneda } from "../../../../financiero/moneda/moneda.model";
import { CajaService } from "../../../../financiero/pdv/caja/caja.service";
import { Delivery } from "../../../../operaciones/delivery/delivery.model";
import { DeliveryEstado } from "../../../../operaciones/delivery/enums";
import { DeliveryService } from "../delivery-dialog/delivery.service";
import { DeliveryMonedaService } from "../delivery-dialog/delivery-moneda.service";
import { cotizacionEmpresa } from "../moneda-pdv.util";
import { DeliveryPresupuestoDialogComponent } from "../delivery-presupuesto-dialog/delivery-presupuesto-dialog.component";
import { DeliveryOpcionesDialogComponent } from "./delivery-opciones-dialog/delivery-opciones-dialog.component";
import { EditDeliveryDialogComponent } from "./edit-delivery-dialog/edit-delivery-dialog.component";

/** Un total del presupuesto en otra moneda: el total en la moneda del PDV dividido por `divisor`. */
export interface FilaTotalPresupuesto {
  rotulo: string;
  divisor: number | null;
  formato: string;
}

export interface ListDeliveryData {
  delivery?: Delivery;
  cambioRs?: number;
  cambioDs?: number;
  monedaList?: Moneda[];
  formaPagoList?: FormaPago[];
  /** Se llama cuando se guarda un delivery nuevo armado con los ítems del carrito del PDV. */
  onCarritoGuardadoEnDelivery?: () => void;
  /**
   * La moneda del PDV y la de la empresa, solo cuando el PDV opera en otra moneda que la de la empresa (Fase 4).
   * Sin ellas todo trabaja como siempre. En ese caso `cambioRs` / `cambioDs` son unidades de la moneda del PDV por R$ / US$.
   */
  monedaPdv?: Moneda;
  monedaEmpresa?: Moneda;
}

/** Un listado: más margen que un escaneo; el aviso lo da el componente. */
const CONTEXTO_LISTA_DELIVERYS = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
/** Abrir un delivery de la lista: el cajero espera de pie (#390). */
const CONSULTA_MOSTRADOR_DELIVERY = { timeoutMs: TIMEOUT_CONSULTA_MOSTRADOR_MS, silenciarAvisoTimeout: true };

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-delivery",
  templateUrl: "./list-delivery.component.html",
  styleUrls: ["./list-delivery.component.scss"],
})
export class ListDeliveryComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("presupuesto", { read: DeliveryPresupuestoDialogComponent })
  presupuesto: DeliveryPresupuestoDialogComponent;
  @ViewChild("newBtn", { read: BotonComponent }) newBtn: BotonComponent;
  @ViewChild("container", { read: ElementRef }) container: ElementRef;
  selectedDelivery: Delivery;
  selectedDeliveryIndex: number;
  dataSource = new MatTableDataSource<Delivery>([]);
  selection = new SelectionModel<Delivery>(null);
  calcularVueltoSub = new BehaviorSubject<void>(null);

  displayedColumns = [
    "id",
    "telefono",
    "cliente",
    "direccion",
    "valor",
    "creadoEn",
    "estado",
  ];
  cambioRs = 1;
  cambioDs = 1;
  isDialogOpen = false;

  /** true solo si el PDV opera en otra moneda que la de la empresa. Con false todo es como siempre. */
  esOtraMoneda = false;
  monedaPdv: Moneda = null;
  /** Unidades de la empresa por 1 unidad de la moneda del PDV (para mostrar la grilla). */
  cotizacionPdv: number = null;
  simboloBase = "";
  formatoBase = "1.0-0";
  /** Los totales que muestra el presupuesto con otra moneda del PDV. */
  filasPresupuesto: FilaTotalPresupuesto[] = [];

  timerList: any[] = [];
  duracionList: string[] = [];

  deliveryEstadoList = [
    DeliveryEstado.ABIERTO,
    DeliveryEstado.EN_CAMINO,
    DeliveryEstado.PARA_ENTREGA,
    DeliveryEstado.CONCLUIDO,
    DeliveryEstado.CANCELADO,
  ];
  filteredDeliveryEstados = [
    DeliveryEstado.ABIERTO,
    DeliveryEstado.EN_CAMINO,
    DeliveryEstado.PARA_ENTREGA,
  ];
  selectedEstadosControl = new FormControl(this.filteredDeliveryEstados);

  constructor(
    private deliveryService: DeliveryService,
    private matDialog: MatDialog,
    private matDialogRef: MatDialogRef<ListDeliveryComponent>,
    @Inject(MAT_DIALOG_DATA) private data: ListDeliveryData,
    private cajaService: CajaService,
    private notificacionSnackbar: NotificacionSnackbarService,
    private deliveryMonedaService: DeliveryMonedaService
  ) {
    this.cambioRs = data.cambioRs;
    this.cambioDs = data.cambioDs;
    if (data.monedaPdv != null && data.monedaEmpresa != null) {
      this.esOtraMoneda = true;
      this.monedaPdv = data.monedaPdv;
      this.cotizacionPdv = cotizacionEmpresa(data.monedaPdv, data.monedaEmpresa);
      this.simboloBase = data.monedaPdv.simbolo || data.monedaPdv.denominacion || "";
      const dec = data.monedaPdv.decimales ?? 2;
      this.formatoBase = `1.${dec}-${dec}`;
      this.armarFilasPresupuesto();
    }
  }

  /** La moneda del PDV, la de la empresa, el real y el dólar (sin repetir ninguna), cada una con cuánto vale de la del PDV. */
  private armarFilasPresupuesto() {
    const pdv = this.data.monedaPdv;
    const decimales = (m: Moneda) => `1.${m?.decimales ?? 2}-${m?.decimales ?? 2}`;
    const nombre = (m: Moneda) => m?.simbolo || m?.denominacion || "";
    const filas: FilaTotalPresupuesto[] = [
      { rotulo: `Total en ${nombre(pdv)}:`, divisor: 1, formato: decimales(pdv) },
      {
        rotulo: `Total en ${nombre(this.data.monedaEmpresa)}:`,
        divisor: this.cotizacionPdv ? 1 / this.cotizacionPdv : null,
        formato: decimales(this.data.monedaEmpresa),
      },
    ];
    const real = this.data.monedaList?.find((m) => m.denominacion == "REAL");
    const dolar = this.data.monedaList?.find((m) => m.denominacion == "DOLAR");
    if (real && String(real.id) !== String(pdv.id)) {
      filas.push({ rotulo: "Total en Rs:", divisor: this.cambioRs || null, formato: "1.2-2" });
    }
    if (dolar && String(dolar.id) !== String(pdv.id)) {
      filas.push({ rotulo: "Total en Ds:", divisor: this.cambioDs || null, formato: "1.2-2" });
    }
    this.filasPresupuesto = filas;
  }
  /**
   * Sin respuesta del servidor (#390): aviso y lista como estaba, en vez de quedar muda. Un error
   * GraphQL llega como null y se trata como lista vacía (antes reventaba en `res.length`).
   */
  private sinRespuestaAvisa<T>() {
    return catchError<T, typeof EMPTY>(() => {
      this.notificacionSnackbar.openWarn("No se pudieron cargar los deliverys: el servidor no responde.", 4);
      return EMPTY;
    });
  }

  ngOnDestroy(): void {
    this.timerList?.forEach((t) => {
      clearInterval(t);
    });
  }

  ngAfterViewInit(): void {
    this.newBtn?.onGetFocus();
    this.deliveryService
      .onDeliveryPorCajaIdAndEstado(
        this.cajaService?.selectedCaja?.id,
        [
          DeliveryEstado.ABIERTO,
          DeliveryEstado.EN_CAMINO,
          DeliveryEstado.PARA_ENTREGA,
        ],
        this.cajaService?.selectedCaja?.sucursalId, false,
        PROPAGAR_ERROR_DE_RED, CONTEXTO_LISTA_DELIVERYS
      )
      .pipe(this.sinRespuestaAvisa(), map((res) => res ?? []))
      .subscribe((res) => {
        this.dataSource.data = res;
        if (this.data.delivery?.id != null) {
          this.data.delivery.venta.id = null;
          this.onDeliveryClick(
            this.data.delivery,
            this.dataSource.data?.findIndex(
              (d) => d.id == this.data.delivery.id
            )
          );
        } else if (this.data.delivery != null) {
          this.selectedDelivery = this.data.delivery;
        }
        this.calcularDuracion();
        // verificar si hay algun delivery seleccionado al iniciar el dialogo, si es asi, buscar el index y dar focus al row correspondiente
        if (res.length > 0) {
          if (this.selectedDelivery?.id != null) {
            // hay delivery seleccionado anteriormente
          } else if (this.selectedDelivery?.venta?.ventaItemList?.length > 0) {
            // el delivery es nuevo y tiene itens
            this.onNuevoDelivery();
          } else {
          }
        } else if (this.selectedDelivery?.venta?.ventaItemList?.length > 0) {
          // el delivery es nuevo y tiene itens
          this.onNuevoDelivery();
        }
      });

    this.container.nativeElement.addEventListener("keydown", (e) => {
      if (!this.isDialogOpen) {
        switch (e.key) {
          case "F12":
            break;
          case "F11":
            break;
          case "F10":
            this.onNuevoDelivery();
            break;
          case "F9":
            break;
          case "F8":
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
          case "Escape":
            break;
          default:
            break;
        }
      }
    });
  }

  ngOnInit(): void {
    // buscar todos los deliverys abiertos, en camino o para entrega
  }

  onFiltrarDeliverys() {
    if (this.selectedEstadosControl.value.length > 0) {
      this.deliveryService
        .onDeliveryPorCajaIdAndEstado(
          this.cajaService?.selectedCaja?.id,
          this.selectedEstadosControl.value,
          this.cajaService?.selectedCaja?.sucursalId, false,
          PROPAGAR_ERROR_DE_RED, CONTEXTO_LISTA_DELIVERYS
        )
        .pipe(this.sinRespuestaAvisa(), map((res) => res ?? []))
        .subscribe((res) => {
          this.dataSource.data = res;
          this.calcularDuracion();
          // verificar si hay algun delivery seleccionado al iniciar el dialogo, si es asi, buscar el index y dar focus al row correspondiente
          if (res.length > 0) {
            if (this.selectedDelivery?.id != null) {
              // hay delivery seleccionado anteriormente
            } else if (
              this.selectedDelivery?.venta?.ventaItemList?.length > 0
            ) {
              // el delivery es nuevo y tiene itens
              this.onNuevoDelivery();
            } else {
            }
          }
        });
    }
  }

  setFocusToNew() {}

  calcularDuracion() {
    this.timerList.forEach((i) => {
      clearInterval(i);
    });
    this.dataSource.data.forEach((e, i) => {
      if (
        e.estado == DeliveryEstado.ABIERTO ||
        e.estado == DeliveryEstado.EN_CAMINO ||
        e.estado == DeliveryEstado.PARA_ENTREGA
      ) {
        let date = new Date(e.creadoEn);
        let time = date.getTime() / 1000;
        let timer = setInterval(() => {
          let now = new Date().getTime() / 1000;
          let result = new Date((now - time) * 1000)
            .toISOString()
            .slice(11, 16);
          this.duracionList[i] = result;
        }, 1000);
        this.timerList.push(timer);
      } else {
        this.duracionList[i] = "";
      }
    });
  }

  onDeliveryClick(row: Delivery, index) {
    this.calcularVueltoSub.next(null);
    // Con un cobro sin confirmar se vuelve a leer del filial: trae sus cobros reales y un objeto sin la marca (#390)
    if (row.venta?.id == null || row.cobroIncierto) {
      this.deliveryService.onGetById(row.id, false, PROPAGAR_ERROR_DE_RED, CONSULTA_MOSTRADOR_DELIVERY).subscribe({ error: () => {
        this.notificacionSnackbar.openWarn('No se pudo abrir el delivery: el filial no responde. Intentá de nuevo.', 4);
      }, next: (res) => {
        if (res == null) {
          return; // Error GraphQL: el servicio ya avisó
        }
        if (!this.esOtraMoneda) {
          return this.alTraerDelivery(res, row, index);
        }
        // El filial guarda los precios en la moneda de la empresa: se llevan a la del PDV antes de usarlo.
        this.deliveryMonedaService.convertirABase(res, this.monedaPdv).subscribe({
          next: (delivery) => this.alTraerDelivery(delivery, row, index),
          error: (err) => this.notificacionSnackbar.openWarn(
            err?.name === "DeliveryMonedaError"
              ? err.message
              : "No se pudo leer la moneda del delivery. Intentá de nuevo.", 6),
        });
      } });
    } else {
      if (row.id == this.selectedDelivery.id) {
        return this.onAbrirDeliveryOpciones(row, index);
      } else {
        this.selectedDelivery = row;
      }
    }
  }

  /** El delivery leído del filial (ya en la moneda del PDV si hace falta): queda seleccionado y, si era el mismo, se abren sus opciones. */
  private alTraerDelivery(res: Delivery, row: Delivery, index) {
    let aux = this.selectedDelivery?.id;
    this.selectedDelivery = res;
    this.dataSource.data = updateDataSource(
      this.dataSource.data,
      this.selectedDelivery,
      index
    );
    if (row.id == aux) {
      return this.onAbrirDeliveryOpciones(row, index);
    }
  }

  onAbrirDeliveryOpciones(row, index) {
    this.matDialog
      .open(DeliveryOpcionesDialogComponent, {
        width: "90%",
        data: this.selectedDelivery,
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null) {
          this.selectedDelivery = res["delivery"];
          switch (res["role"]) {
            case "edit-itens":
              this.matDialogRef.close({
                delivery: this.selectedDelivery,
                role: "edit",
              });
              break;
            case "enviar":
              break;
            case "edit-info":
              this.onNuevoDelivery(this.selectedDelivery, index);
              break;
            case "para-entrega": {
              // El estado se muestra antes de la respuesta, sobre la misma referencia que está en
              // la grilla: si el guardado falla hay que volver al estado anterior. Se guarda la
              // referencia porque selectedDelivery puede cambiar antes de que llegue el error.
              const delivery = this.selectedDelivery;
              const estadoAnterior = delivery.estado;
              this.selectedDelivery.estado = DeliveryEstado.PARA_ENTREGA;
              this.deliveryService
                .onSaveDeliveryEstado(
                  this.selectedDelivery?.id,
                  DeliveryEstado.PARA_ENTREGA,
                  false
                )
                .subscribe({
                  next: (res) => {
                    if (res != null) {
                      this.selectedDelivery.estado = res.estado;
                      this.dataSource.data = updateDataSource(
                        this.dataSource.data,
                        this.selectedDelivery,
                        index
                      );
                      this.calcularDuracion();
                    }
                  },
                  // El aviso de error (negocio o red) ya lo muestra GenericCrudService.onSaveCustom.
                  error: () => {
                    delivery.estado = estadoAnterior;
                  }
                });
              break;
            }
            case "finalizar":
              this.matDialogRef.close({
                role: "finalizar",
                delivery: this.selectedDelivery,
              });
              break;
            case "reimprimir":
              this.deliveryService
                .onReimprimirDelivery(this.selectedDelivery.id, false)
                .subscribe();
              break;
            default:
              break;
          }
        }
      });
  }

  onEditItens() {}

  onNuevoDelivery(delivery?: Delivery, index?) {
    this.matDialog
      .open(EditDeliveryDialogComponent, {
        width: "700px",
        data: {
          delivery: delivery != null ? delivery : this.data?.delivery,
          monedaList: this.data?.monedaList,
          cambioRs: this.cambioRs,
          cambioDs: this.cambioDs,
          formaPagoList: this.data.formaPagoList,
          monedaPdv: this.data?.monedaPdv,
          monedaEmpresa: this.data?.monedaEmpresa,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null && res["delivery"] != null) {
          // Delivery nuevo armado desde el carrito: sus ítems ya son del delivery. Se mira el id del
          // delivery y no el de la venta, que se pone en null al reabrir la lista (#313).
          if (delivery == null && this.data?.delivery?.id == null) {
            this.data?.onCarritoGuardadoEnDelivery?.();
          }
          if (delivery != null) {
            this.dataSource.data = updateDataSource(
              this.dataSource.data,
              res["delivery"],
              index
            );
          } else {
            this.dataSource.data = updateDataSource(
              this.dataSource.data,
              res["delivery"]
            );
          }
          this.selectedDelivery = res["delivery"];
          this.selectedDelivery.venta.id = null;
          this.onDeliveryClick(
            this.selectedDelivery,
            this.dataSource.data.findIndex(
              (d) => d.id == this.selectedDelivery.id
            )
          );
          this.calcularDuracion();
        }
      });
  }

  onEditDelivery(delivery: Delivery, index) {
    this.matDialog
      .open(EditDeliveryDialogComponent, {
        width: "700px",
        data: {
          delivery: delivery,
          monedaList: this.data?.monedaList,
          cambioRs: this.cambioRs,
          cambioDs: this.cambioDs,
          monedaPdv: this.data?.monedaPdv,
          monedaEmpresa: this.data?.monedaEmpresa,
        },
      })
      .afterClosed()
      .subscribe((res) => {
        if (res != null && res["delivery"] != null) {
          this.dataSource.data = updateDataSource(
            this.dataSource.data,
            res["delivery"],
            index
          );
          this.selectedDelivery = res["delivery"];
          this.onDeliveryClick(this.selectedDelivery, index);
          this.calcularDuracion();
        }
      });
  }

  onGetPresupuesto() {
    this.presupuesto.copyToClipboard();
  }

  onVer(e) {}

  onFinalizar(e) {}

  onVuelto(e) {}

  onSalir() {
    this.matDialogRef.close();
  }
}
