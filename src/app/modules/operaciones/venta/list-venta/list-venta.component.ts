import {
  trigger,
  state,
  style,
  transition,
  animate,
} from "@angular/animations";
import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { TabData, TabService } from "../../../../layouts/tab/tab.service";
import { CargandoDialogService } from "../../../../shared/components/cargando-dialog/cargando-dialog.service";
import { PdvCaja, PdvCajaReapertura } from "../../../financiero/pdv/caja/caja.model";
import { CajaService } from "../../../financiero/pdv/caja/caja.service";
import { CajaPorIdGQL } from "../../../financiero/pdv/caja/graphql/cajaPorId";
import { CobroDetalle } from "../cobro/cobro-detalle.model";
import { Venta } from "../venta.model";
import { ErrorCancelacionVenta, VentaService } from "../venta.service";
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from "../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../shared/services/timeout-link";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { of } from "rxjs";
import { catchError } from "rxjs/operators";
import { FormControl, FormGroup } from "@angular/forms";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { VentaEstado } from "../enums/venta-estado.enums";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { Tab } from "../../../../layouts/tab/tab.model";
import { ListRetiroComponent } from "../../../financiero/retiro/list-retiro/list-retiro.component";
import { PageInfo } from "../../../../app.component";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatDialog } from "@angular/material/dialog";
import { AdicionarCajaDialogComponent } from "../../../financiero/pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component";
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { ListGastosComponent } from "../../../financiero/gastos/pages/list-gastos/list-gastos.component";
import { Conteo } from "../../../financiero/conteo/conteo.model";
import { MainService } from "../../../../main.service";
import { erroresDeRechazo, motivoDelRechazo } from "../../../../commons/core/utils/graphqlErrorUtils";
import { ROLES } from "../../../personas/roles/roles.enum";
import { VentaObservacionDashboardComponent } from "../../venta-observacion/venta-observacion-dashboard/venta-observacion-dashboard.component";
import { VentaObservacion } from "../../venta-observacion/venta-observacion.model";
import { SubCategoriaObservacion } from "../../sub-categoria-observacion/sub-categoria-observacion.model";
import { VentaObservacionService } from "../../venta-observacion/venta-observacion.service";
import { VentaTarjetaService } from "../../../financiero/venta-tarjeta/venta-tarjeta.service";
import { terminarSiFalla } from '../../../../commons/core/utils/rxjsUtils';
import { LoteService } from '../../lote/lote.service';
import { LoteVentaItem } from '../../lote/lote.model';
import { agruparLotesPorItem, puedeVerLotesDeVenta, textoLotesDeItem } from '../../lote/lotes-de-venta.util';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-list-venta",
  templateUrl: "./list-venta.component.html",
  styleUrls: ["./list-venta.component.scss"],
  animations: [
    trigger("detailExpand", [
      state("collapsed", style({ height: "0px", minHeight: "0" })),
      state("expanded", style({ height: "*" })),
      transition(
        "expanded <=> collapsed",
        animate("225ms cubic-bezier(0.4, 0.0, 0.2, 1)")
      ),
    ]),
  ],
})
export class ListVentaComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Input()
  data: Tab;

  addVentaObservacionDataSource = new MatTableDataSource<VentaObservacion>([]);
  ventaDataSource = new MatTableDataSource<Venta>([]);
  subCategoriaObsDataSource = new MatTableDataSource<SubCategoriaObservacion>([])
  ventaDisplayedColumns = [
    "id",
    "cliente",
    "fecha",
    "estado",
    "total",
    "modo",
    "acciones",
  ];
  expandedVenta: Venta;
  ventaList: Venta[];
  selectedCaja: PdvCaja;
  /** Reaperturas de la caja (#662) para el resumen. Vacío si nunca se reabrió o si la consulta falla. */
  reaperturas: PdvCajaReapertura[] = [];
  ventaObservacionList: VentaObservacion[];
  loading = false;
  isCargando = false;
  isLastPage = false;
  idVentaControl = new FormControl();
  formaPagoControl = new FormControl();
  modoControl = new FormControl();
  monedaControl = new FormControl();
  selectedFormaPago: FormaPago;
  formaPagoList: FormaPago[] = [];
  monedaList: Moneda[];
  totalRecibidoGs = 0;
  totalRecibido = 0;
  totalRecibidoRs = 0;
  totalDescuento = 0;
  totalRecibidoDs = 0;
  totalAumento = 0;
  totalFinal = 0;
  ventaEstadoList = Object.keys(VentaEstado);
  estadoControl = new FormControl(null);
  filterChanged = true;
  conObsControl = new FormControl(false);
  conDescuentoControl = new FormControl(false);
  conAumentoControl = new FormControl(false);

  length = 15;
  pageSize = 15;
  pageIndex = 0;
  pageEvent: PageEvent;
  orderById = null;
  orderByNombre = null;
  selectedPageInfo: PageInfo<Venta>;
  form: FormGroup;
  isLoading = false;

  /** Cancelar o reactivar exige CANCELACION DE VENTA (o ADMIN) también en el central (#340): sin el rol no se ofrece. */
  puedeCancelarVenta = false;

  /** Ver de qué lote salió cada ítem (#429 fase 2): VER PRODUCTOS y análisis de caja o de venta. */
  puedeVerLotes = false;
  /** Lotes por ítem de la venta abierta, cargados aparte; vacío si el central es viejo o falla. */
  lotesPorItem: { [ventaItemId: string]: LoteVentaItem[] } = {};
  private lotesCargadosDe: string = null;

  constructor(
    private loteService: LoteService,
    private cajaService: CajaService,
    private ventaService: VentaService,
    private cargandoService: CargandoDialogService,
    private notificacionService: NotificacionSnackbarService,
    private dialogoService: DialogosService,
    private formaPagoService: FormaPagoService,
    private tabService: TabService,
    private matDialog: MatDialog,
    private monedaService: MonedaService,
    private mainService: MainService,
    private ventaObservacionService: VentaObservacionService,
    private cd: ChangeDetectorRef,
    private ventaTarjetaService: VentaTarjetaService
  ) { }

  ngOnInit(): void {
    this.puedeCancelarVenta = this.mainService.tieneAlgunRol([ROLES.CANCELACION_DE_VENTA]);
    this.puedeVerLotes = puedeVerLotesDeVenta(this.mainService.usuarioActual?.roles);
    this.monedaService.onGetAll().subscribe((data: Moneda[]) => {
      this.monedaList = data;
    });

    if (this.data?.tabData?.data != null) {
      // Verificar si data es un objeto con caja y ventaId, o solo la caja (compatibilidad hacia atrás)
      const tabData = this.data.tabData.data;
      let ventaId: number = null;

      if (tabData.caja) {
        this.selectedCaja = tabData.caja;
        ventaId = tabData.ventaId;
      } else {
        // Compatibilidad: si solo viene la caja directamente
        this.selectedCaja = tabData;
      }

      this.cajaService
        .onGetByIdSimp(this.selectedCaja.id, this.selectedCaja.sucursalId, true)
        // La pestaña ya recibió la caja; esta lectura la completa (sucursal). Si falla y la que vino ya trae
        // su sucursal, se sigue con esa en vez de dejar la lista vacía; si no, no se consulta a ciegas (#390).
        .pipe(terminarSiFalla(() => {
          if (this.selectedCaja?.sucursalId == null && this.selectedCaja?.sucursal?.id == null) {
            this.notificacionService.openWarn('No se pudo cargar la caja: cerrá esta pestaña y volvé a abrirla.', 8);
            return;
          }
          if (ventaId) this.idVentaControl.setValue(ventaId);
          this.buscar();
          this.onGetBalance();
        }))
        .subscribe((res) => {
          if (res != null) {
            this.selectedCaja = res;
            // Establecer el filtro de ventaId si existe, antes de filtrar
            if (ventaId) {
              this.idVentaControl.setValue(ventaId);
            }
            this.buscar();
            this.onGetBalance();
          }
        });
    } else {
      this.tabService.removeTab(this.tabService.currentIndex);
    }

    this.formaPagoService.onGetAllFormaPago().subscribe((res) => {
      this.formaPagoList = res;
    });

    this.ventaObservacionService.ventaObservacionBS
      .pipe(untilDestroyed(this))
      .subscribe((observaciones: VentaObservacion[]) => {
        this.ventaObservacionList = observaciones;
        this.onObservado(this.ventaDataSource.data);
        this.ventaDataSource.data = [...this.ventaDataSource.data];
      })

    this.form = new FormGroup({
      id: this.idVentaControl,
      formaPago: this.formaPagoControl,
      estado: this.estadoControl,
      conObservacion: this.conObsControl,
      conDescuento: this.conDescuentoControl,
      conAumento: this.conAumentoControl
    });

    this.form.valueChanges.subscribe((res) => {
      this.filterChanged = true;
    });
  }

  // Un filtro nuevo arranca en la página 1: la página actual puede no existir en el resultado filtrado.
  onFiltrar() {
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.buscar();
  }

  buscar() {
    // if (this.idVentaControl.value != null) {
    //   this.ventaService
    //     .onGetPorId(this.idVentaControl.value, this.selectedCaja?.sucursalId)
    //     .pipe(untilDestroyed(this))
    //     .subscribe((res) => {
    //       if (res != null && res?.caja?.id == this.selectedCaja?.id) {
    //         this.ventaDataSource.data = [];
    //         this.ventaDataSource.data = updateDataSource(
    //           this.ventaDataSource.data,
    //           res
    //         );
    //       }
    //     });
    // } else {
    this.onGetVentas();
    // }
  }

  /** Quién reabrió la caja, cuándo y por qué (#662). Se lee del central. */
  cargarReaperturas(): void {
    const cajaId = this.selectedCaja?.id;
    const sucursalId = this.selectedCaja?.sucursalId ?? this.selectedCaja?.sucursal?.id;
    if (cajaId == null || sucursalId == null) {
      this.reaperturas = [];
      return;
    }
    this.cajaService
      .onGetReaperturas(+cajaId, +sucursalId)
      .pipe(catchError(() => of([])), untilDestroyed(this))
      .subscribe((res) => this.reaperturas = res ?? []);
  }

  onGetBalance() {
    this.cargarReaperturas();
    this.isLoading = true;
    this.cajaService
      .onCajaBalancePorIdAndSucursalId(
        this.selectedCaja.id,
        this.selectedCaja?.sucursal?.id,
        true,
        PROPAGAR_ERROR_DE_RED,
        { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true }
      )
      .subscribe({ error: () => {
        // Sin balance leído no queda el total anterior (p. ej. el de antes de una cancelación) (#390)
        this.isLoading = false;
        if (this.selectedCaja) this.selectedCaja.balance = null;
        this.balanceNoDisponible = true;
        this.notificacionService.openWarn('No se pudo actualizar el balance de la caja: el servidor no responde.', 5);
      }, next: (res) => {
        this.isLoading = false;
        // null = error GraphQL (el servicio ya avisó): tampoco queda el total anterior
        this.selectedCaja.balance = res ?? null;
        this.balanceNoDisponible = res == null;
      } });
  }

  onFilterChange() {
    this.filterChanged = true;
  }

  onGetVentas() {
    // this.cargandoService.openDialog()
    // this.isCargando = true;
    this.ventaService
      .onSearch(
        this.idVentaControl.value,
        this.selectedCaja.id,
        this.pageIndex,
        this.pageSize,
        true,
        this.selectedCaja.sucursalId,
        this.formaPagoControl.value,
        this.estadoControl.value,
        this.modoControl.value,
        this.monedaControl.value?.id,
        this.conDescuentoControl.value,
        this.conAumentoControl.value,
        true,
        PROPAGAR_ERROR_DE_RED,
        undefined,
        { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }
      )
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        // Sin filas del filtro anterior a la vista como si fueran del nuevo (#390)
        this.selectedPageInfo = null;
        this.ventaDataSource.data = [];
        this.notificacionService.openWarn('No se pudo cargar la lista de ventas: el servidor no responde. Intentá de nuevo.', 5);
      }, next: (res) => {
        // this.cargandoService.closeDialog()
        // this.isCargando = false;
        if (res != null) {
          this.selectedPageInfo = res;
          let ventas: Venta[] = res.getContent;
          ventas = this.onObservado(ventas);
          this.ventaDataSource.data = ventas;
        } else {
          this.selectedPageInfo = null;
          this.ventaDataSource.data = []; // error GraphQL: el servicio ya avisó
        }
      } });
  }

  onClickRow(venta: Venta, index) {
    this.cargarLotesDeVenta(venta);
    if (venta.ventaItemList == null) {
      this.loading = true;
      this.ventaService
        .onGetPorId(venta.id, venta?.sucursalId, true, true, PROPAGAR_ERROR_DE_RED,
          { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true })
        .pipe(untilDestroyed(this))
        .subscribe({ error: () => {
          this.loading = false;
          this.notificacionService.openWarn('No se pudo cargar el detalle de la venta: el servidor no responde.', 5);
        }, next: (res) => {
          this.loading = false;
          if (res != null) {
            let selectedVenta = this.ventaDataSource.data[index];
            selectedVenta.cobro = res.cobro;
            selectedVenta.isDelivery = res.isDelivery;
            selectedVenta.delivery = res.delivery;
            selectedVenta.ventaItemList = res.ventaItemList;
            this.ventaDataSource.data = updateDataSource(
              this.ventaDataSource.data,
              venta,
              index
            );
            this.getTotales(venta);
          }
        } });
    } else {
      this.getTotales(venta);
    }
    // this.loadObservaciones();
  }

  /**
   * Carga aparte, sin bloquear el detalle, de qué lote salió cada ítem. Si el central todavía no
   * tiene la consulta o falla, no se muestra nada y el detalle sigue igual.
   */
  cargarLotesDeVenta(venta: Venta) {
    const sucursalId = venta?.sucursalId ?? this.selectedCaja?.sucursalId;
    if (!this.puedeVerLotes || venta?.id == null || sucursalId == null) return;
    const clave = venta.id + '-' + sucursalId;
    if (this.lotesCargadosDe === clave) return;
    this.lotesCargadosDe = clave;
    this.lotesPorItem = {};
    this.loteService.onLotesDeVenta(venta.id, sucursalId)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (filas) => {
          if (this.lotesCargadosDe === clave) this.lotesPorItem = agruparLotesPorItem(filas);
        },
        error: () => {
          if (this.lotesCargadosDe === clave) this.lotesPorItem = {};
        }
      });
  }

  /** «Lote X · Vto dd/mm/aa» de un ítem; con varios lotes, cada uno con sus unidades. */
  textoLotes(ventaItemId: number): string {
    return textoLotesDeItem(this.lotesPorItem[String(ventaItemId)]);
  }

  getTotales(venta: Venta) {
    this.totalRecibidoGs = 0;
    this.totalRecibidoRs = 0;
    this.totalRecibidoDs = 0;
    this.totalAumento = 0;
    this.totalDescuento = 0;
    // El pago ya incluye el aumento: el total final es el de la venta, como la columna «Total» (#553)
    this.totalFinal = (venta?.totalGs ?? 0) + (venta?.delivery?.precio?.valor ?? 0);
    this.totalRecibido = 0;

    // Hasta 2024-10 el aumento se guardaba en negativo: se toma en valor absoluto, como el balance (#553)
    venta?.cobro?.cobroDetalleList.forEach((res) => {
      if (res.moneda.denominacion == "GUARANI") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoGs += res.valor;
          this.totalRecibido += res.valor;
        } else if (res.aumento) {
          this.totalAumento += Math.abs(res.valor);
        } else if (res.descuento) this.totalDescuento += res.valor;
      } else if (res.moneda.denominacion == "REAL") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoRs += res.valor;
          this.totalRecibido += res.valor * res.cambio;
        } else if (res.aumento) {
          this.totalAumento += Math.abs(res.valor * res.cambio);
        } else if (res.descuento) {
          this.totalDescuento += res.valor * res.cambio;
        }
      } else if (res.moneda.denominacion == "DOLAR") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoDs += res.valor;
          this.totalRecibido += res.valor * res.cambio;
        } else if (res.aumento) {
          this.totalAumento += Math.abs(res.valor * res.cambio);
        } else if (res.descuento) {
          this.totalDescuento += res.valor * res.cambio;
        }
      }
    });
  }
  getCobroTotal(lista: CobroDetalle[], moneda: string): number {
    let total = 0;
    lista?.forEach((c) => {
      if (c.moneda.denominacion == moneda && (c.pago || c.vuelto) && !c.aumento)
        total += c.valor;
    });
    return total;
  }

  getCobroTotalGeneral(
    lista: CobroDetalle[],
    descuento?: boolean,
    aumento?: boolean
  ): number {
    let total = 0;
    lista?.forEach((c) => {
      if (descuento && !c.aumento) {
        if (c.descuento) total += c.valor;
      } else if ((c.pago || c.vuelto) && !c.aumento)
        total += c.valor * c.cambio;
    });
    return total;
  }

  getCobroTotalFinal(lista: CobroDetalle[]): number {
    let total = 0;
    lista?.forEach((c) => {
      if (c.aumento) {
        // total -= c.valor * c.cambio;
      } else {
        total += c.valor * c.cambio;
      }
      // if (c.descuento) total -= c.valor * c.cambio;
    });
    return total;
  }

  /** El balance de la caja no se pudo leer: se muestra «—», no el total anterior (#390). */
  balanceNoDisponible = false;

  /** Ventas cuya cancelación o reactivación quedó sin confirmar: bloqueadas hasta releerlas del central (#390). */
  private ventasSinConfirmar = new Set<string>();

  /**
   * El central ALTERNA el estado (una venta cancelada se reactiva). Antes se mandaba según el estado de la fila,
   * sin `error:`: con la fila vieja o un intento anterior aplicado sin respuesta, se hacía lo contrario de lo
   * confirmado. Ahora se relee del central y solo se manda si el estado no cambió (#390).
   */
  onCancelarVenta(venta: Venta, index: number) {
    const clave = `${venta.id}-${venta.sucursalId}`;
    if (this.ventasSinConfirmar.has(clave)) {
      this.releerVentaSinConfirmar(venta, index, clave);
      return;
    }
    const estabaCancelada = venta.estado == VentaEstado.CANCELADA;
    const accion = estabaCancelada ? "reactivar" : "cancelar";
    this.dialogoService
      .confirm("Atención!!", `Realmente desea ${accion} esta venta?`)
      .subscribe((res) => {
        if (!res) return;
        this.ventaService
          .onCancelarVentaVerificando(venta.id, venta.sucursalId, { estadoEsperado: venta.estado })
          .subscribe({
            next: (resultado) => {
              if (resultado.tipo === "cambio") {
                // Otro usuario (o un intento anterior) ya la cambió: no se mandó nada
                venta.estado = resultado.estadoActual;
                this.ventaDataSource.data = updateDataSource(this.ventaDataSource.data, venta, index);
                this.notificacionService.openWarn(
                  `La venta ya estaba ${resultado.estadoActual} en el servidor: no se envió nada. Revisá antes de volver a intentar.`, 8);
                this.onGetBalance();
                return;
              }
              if (resultado.tipo === "rechazada") {
                this.notificacionService.openAlgoSalioMal(`Ups! No se pudo ${accion} la venta. `);
                return;
              }
              this.notificacionService.openSucess(
                estabaCancelada ? "Venta reactivada con éxito" : "Venta cancelada con éxito"
              );
              if (estabaCancelada) {
                venta.estado = VentaEstado.CONCLUIDA;
              } else {
                venta.estado = VentaEstado.CANCELADA;
                this.ventaTarjetaService.onCancelarPorVentaId(venta.id, venta.sucursalId).subscribe({
                  next: (ok) => { if (!ok) console.warn('[VentaTarjeta] cancelar retornó false — sin registro asociado a ventaId', venta.id); },
                  error: (err) => {
                    console.error('[VentaTarjeta] error al cancelar registro de tarjeta:', err);
                    this.avisarCancelacionTarjetaRechazada(err);
                  }
                });
              }
              this.ventaDataSource.data = updateDataSource(this.ventaDataSource.data, venta, index);
              this.onGetBalance();
            },
            error: (e: ErrorCancelacionVenta) => {
              if (e?.fase === "lectura") {
                this.notificacionService.openWarn(
                  "No se pudo verificar el estado de la venta en el servidor: no se envió nada. Intentá de nuevo.", 6);
                return;
              }
              // El central respondió que no (por ejemplo, falta el rol): no se aplicó nada y el genérico ya mostró el
              // motivo (#488)
              if (erroresDeRechazo(e?.error) != null) {
                return;
              }
              // La mutación no respondió: pudo haberse aplicado. Se bloquea la fila y se relee.
              this.ventasSinConfirmar.add(clave);
              this.notificacionService.openWarn(
                `No se pudo confirmar si la venta se llegó a ${accion}: se vuelve a leer del servidor antes de permitir otro intento.`, 8);
              this.releerVentaSinConfirmar(venta, index, clave);
            },
          });
      });
  }

  private releerVentaSinConfirmar(venta: Venta, index: number, clave: string): void {
    this.ventaService.onLeerEstadoEnCentral(venta.id, venta.sucursalId).subscribe({
      next: (estado) => {
        venta.estado = estado;
        this.ventasSinConfirmar.delete(clave);
        if (estado == VentaEstado.CANCELADA) {
          // La cancelación sí se había aplicado: se cancela también su registro de tarjeta (escribe CANCELADO:
          // repetirlo no cambia nada), igual que en el camino confirmado
          this.ventaTarjetaService.onCancelarPorVentaId(venta.id, venta.sucursalId).subscribe({
            error: (err) => {
              console.error('[VentaTarjeta] error al cancelar registro de tarjeta:', err);
              this.avisarCancelacionTarjetaRechazada(err);
            }
          });
        }
        this.ventaDataSource.data = updateDataSource(this.ventaDataSource.data, venta, index);
        this.notificacionService.openWarn(`La venta ${venta.id} está ${estado} en el servidor.`, 6);
        this.onGetBalance();
      },
      error: () => this.notificacionService.openWarn(
        `No se pudo leer la venta ${venta.id}: la acción queda bloqueada hasta confirmar su estado. Intentá de nuevo en unos segundos.`, 8),
    });
  }

  onResetFiltro() {
    this.idVentaControl.setValue(null);
    this.formaPagoControl.setValue(null);
    this.estadoControl.setValue(null);
    this.modoControl.setValue(null);
    this.monedaControl.setValue(null);
    this.selectedFormaPago = null;
    this.ventaDataSource.data = [];
    // Sin consulta, como antes, pero sin dejar el paginador en la página y el total del filtro anterior.
    this.selectedPageInfo = null;
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.conObsControl.setValue(false);
    this.conDescuentoControl.setValue(false);
    this.conAumentoControl.setValue(false);
  }

  onGoToRetiros() {
    let tabData: TabData = new TabData();
    tabData.data = {
      caja: this.selectedCaja,
      sucursal: this.selectedCaja.sucursal,
    };
    this.tabService.addTab(
      new Tab(
        ListRetiroComponent,
        "Retiros de caja " + this.selectedCaja.id,
        tabData,
        ListVentaComponent
      )
    );
  }

  onGoToGastos() {
    let tabData: TabData = new TabData();
    tabData.data = {
      caja: this.selectedCaja,
      sucursal: this.selectedCaja.sucursal,
    };
    this.tabService.addTab(
      new Tab(
        ListGastosComponent,
        "Gastos de caja " + this.selectedCaja.id,
        tabData,
        ListVentaComponent
      )
    );
  }

  handlePageEvent(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.buscar();
  }

  abrirConteo() {
    this.tabService.addTab(
      new Tab(
        AdicionarCajaDialogComponent,
        "Conteo de caja " +
        this.selectedCaja.id +
        " de " +
        this.selectedCaja.sucursal.nombre,
        new TabData(this.selectedCaja.id, this.selectedCaja)
      )
    );
  }

  onVerificado() {
    let verificado = this.selectedCaja?.verificado;
    let texto =
      verificado != true
        ? "Al marcar esta caja como verificada usted está afirmando que realizó todos los procesos de verificación"
        : "Al anular la verificación esta caja volvera a tener el estatus de no verificado";
    this.dialogoService
      .confirm("Atención!!", texto, "Desea continuar?")
      .subscribe((res) => {
        if (res) {
          if (verificado) {
            verificado = false;
          } else {
            verificado = true;
          }
          this.cajaService
            .onVerificarCaja(
              this.selectedCaja?.id,
              this.selectedCaja?.sucursalId,
              this.mainService?.usuarioActual?.id,
              verificado
            )
            .subscribe((resVerif) => {
              if (resVerif) {
                this.selectedCaja.verificado = resVerif;
                this.selectedCaja.verificadoPor =
                  this.mainService?.usuarioActual;
              }
            });
        }
      });
  }

  onObservado(ventas: Venta[]): Venta[] {
    ventas.forEach((venta) => {
      venta['hasObservation'] = venta.ventaObservacionList && venta.ventaObservacionList.length > 0;
    });

    if (this.conObsControl.value) {
      ventas = ventas.filter((sale) => sale['hasObservation']);
    }

    return ventas;
  }

  onListObservaciones(venta: Venta) {
    const dialogRef = this.matDialog
      .open(VentaObservacionDashboardComponent, {
        width: "1950px",
        height: "550px",
        data: { venta: venta }
      })
    dialogRef.afterClosed()
      .subscribe(() => {
        this.ventaObservacionService.onGetVentasObservaciones().subscribe();
      })
  }

  onToggleConObs(selected: boolean) {
    this.conObsControl.setValue(selected);
  }

  onToggleConDescuento(selected: boolean) {
    this.conDescuentoControl.setValue(selected);
  }

  onToggleConAumento(selected: boolean) {
    this.conAumentoControl.setValue(selected);
  }

  /**
   * La cancelación del cobro con tarjeta en la sucursal es un respaldo: el central ya lo cancela con la venta. Un corte no
   * se avisa (en un desktop sin filial saltaría siempre); un rechazo sí, con su motivo, porque es silenciosa (#488).
   */
  private avisarCancelacionTarjetaRechazada(err: any): void {
    if (erroresDeRechazo(err) == null) {
      console.warn('[VentaTarjeta] sin respuesta de la sucursal al cancelar el cobro con tarjeta: lo cancela el central', err);
      return;
    }
    this.notificacionService.openWarn(
      `La venta se canceló, pero la sucursal rechazó cancelar su cobro con tarjeta: ${motivoDelRechazo(err) ?? 'sin detalle'}.`, 8);
  }
}
