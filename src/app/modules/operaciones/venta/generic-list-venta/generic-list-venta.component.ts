import { Venta } from "../venta.model";
import { ErrorCancelacionVenta, VentaService } from "../venta.service";
import { PROPAGAR_ERROR_DE_RED, TIMEOUT_CONSULTA_DE_FONDO_MS } from "../../../../generics/generic-crud.service";
import { MatSort } from "@angular/material/sort";
import { PageInfo } from "../../../../app.component";
import { MatDialog } from "@angular/material/dialog";
import { FormControl, FormGroup } from "@angular/forms";
import { Tab } from "../../../../layouts/tab/tab.model";
import { VentaEstado } from "../enums/venta-estado.enums";
import { MatTableDataSource } from "@angular/material/table";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { PdvCaja } from "../../../financiero/pdv/caja/caja.model";
import { Cliente } from "../../../personas/clientes/cliente.model";
import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { CajaService } from "../../../financiero/pdv/caja/caja.service";
import { MonedaService } from "../../../financiero/moneda/moneda.service";
import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model";
import { updateDataSource } from "../../../../commons/core/utils/numbersUtils";
import { SucursalService } from "../../../empresarial/sucursal/sucursal.service";
import { animate, state, style, transition, trigger } from "@angular/animations";
import { VentaObservacion } from "../../venta-observacion/venta-observacion.model";
import { FormaPagoService } from "../../../financiero/forma-pago/forma-pago.service";
import { NotificacionSnackbarService } from "../../../../notificacion-snackbar.service";
import { DialogosService } from "../../../../shared/components/dialogos/dialogos.service";
import { VentaObservacionService } from "../../venta-observacion/venta-observacion.service";
import { VentaTarjetaService } from "../../../financiero/venta-tarjeta/venta-tarjeta.service";
import { MainService } from "../../../../main.service";
import { erroresDeRechazo } from "../../../../commons/core/utils/graphqlErrorUtils";
import { mensajeDeError } from "../../../financiero/venta-tarjeta/qr-pos/mensaje-error";
import { ROLES } from "../../../personas/roles/roles.enum";
import { ClientesSearchConFiltrosGQL } from "../../../personas/clientes/graphql/clienteWithFilters";
import { VentaObservacionDashboardComponent } from "../../venta-observacion/venta-observacion-dashboard/venta-observacion-dashboard.component";
import { SearchListDialogComponent, SearchListtDialogData, TableData } from "../../../../shared/components/search-list-dialog/search-list-dialog.component";

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-generic-list-venta',
  templateUrl: './generic-list-venta.component.html',
  styleUrls: ['./generic-list-venta.component.scss'],
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
export class GenericListVentaComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  @Input() data: Tab;
  @Input() isGenerarReporteDisabled: boolean = true;

  today = new Date();
  selectedCliente: Cliente;
  selectedCaja: PdvCaja;
  ventaDataSource = new MatTableDataSource<Venta>([]);
  ventaDisplayedColumns = [
    "id",
    "cliente",
    "sucursal",
    "fecha",
    "formaPago",
    "estado",
    "total",
    "modo",
    "acciones"
  ];

  form: FormGroup;
  modoControl = new FormControl();
  estadoControl = new FormControl();
  conObsControl = new FormControl();
  monedaControl = new FormControl();
  idVentaControl = new FormControl();
  clienteControl = new FormControl();
  fechaFinControl = new FormControl();
  sucursalControl = new FormControl();
  formaPagoControl = new FormControl();
  conAumentoControl = new FormControl();
  fechaInicioControl = new FormControl();
  conDescuentoControl = new FormControl();

  expandedVenta: Venta;
  sucursalIdList: number[];
  monedaList: Moneda[] = [];
  sucursalList: Sucursal[] = [];
  formaPagoList: FormaPago[] = [];
  ventaObservacionList: VentaObservacion[];
  ventaEstadoList = Object.keys(VentaEstado)

  // Pagination
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  totalFinal = 0;
  totalAumento = 0;
  totalRecibido = 0;
  isLoading = false;
  isLastPage = false;
  totalDescuento = 0;
  totalRecibidoRs = 0;
  totalRecibidoDs = 0;
  totalRecibidoGs = 0;
  selectedPageInfo: PageInfo<Venta>;

  /** Cancelar o reactivar exige CANCELACION DE VENTA (o ADMIN) también en el central (#340): sin el rol no se ofrece. */
  puedeCancelarVenta = false;

  constructor(
    private matDialog: MatDialog,
    private cajaService: CajaService,
    private ventaService: VentaService,
    private monedaService: MonedaService,
    private dialogoService: DialogosService,
    private sucursalService: SucursalService,
    private formaPagoService: FormaPagoService,
    private clienteSearch: ClientesSearchConFiltrosGQL,
    private ventaObservacionService: VentaObservacionService,
    private notificacionService: NotificacionSnackbarService,
    private ventaTarjetaService: VentaTarjetaService,
    private mainService: MainService
  ) { }

  ngOnInit(): void {
    this.puedeCancelarVenta = this.mainService.tieneAlgunRol([ROLES.CANCELACION_DE_VENTA]);
    
    let hoy = new Date();
    let aux = new Date();
    aux.setDate(hoy.getDate() - 7);
    
    this.form = new FormGroup({
      modo: this.modoControl,
      id: this.idVentaControl,
      estado: this.estadoControl,
      moneda: this.monedaControl,
      cliente: this.clienteControl,
      fechaFin: this.fechaFinControl,
      sucursal: this.sucursalControl,
      formaPago: this.formaPagoControl,
      conObservacion: this.conObsControl,
      conAumento: this.conAumentoControl,
      fechaInicio: this.fechaInicioControl,
      conDescuento: this.conDescuentoControl
    });

    this.formaPagoService.onGetAllFormaPago().subscribe((res) => {
      this.formaPagoList = res;
    });
    
    this.monedaService.onGetAll().subscribe((res) => {
      this.monedaList = res;
    });

    this.sucursalList = [];
    this.sucursalIdList = [];

    this.sucursalService.onGetAllSucursalesByActive(true, true)
      .subscribe((res) => {
        this.sucursalList = res.filter((s) => {
          if (s.id != 0 && s.id != 999) {
            this.sucursalIdList.push(s.id);
            return s;
          }
      });
    })

    this.ventaObservacionService.ventaObservacionBS
      .pipe(untilDestroyed(this))
      .subscribe((observaciones: VentaObservacion[]) => {
        this.ventaObservacionList = observaciones;
        this.onObservado(this.ventaDataSource.data);
        this.ventaDataSource.data = [...this.ventaDataSource.data];
      })

    this.aplicarFiltroInicial();
  }

  /**
   * Cuando otra pantalla abre esta solapa apuntando a una venta puntual, deja los filtros puestos
   * y busca sola. Sin esto la pantalla abre vacía y el operador tiene que retipear el número que
   * acaba de clickear.
   *
   * Van el número Y la sucursal porque la clave de venta es el par (id, sucursalId): filtrar solo
   * por número traería la venta homónima de cada sucursal.
   *
   * Abierta desde el menú no llega tabData y todo sigue como antes: sin filtro y sin buscar.
   */
  private aplicarFiltroInicial(): void {
    const filtro = this.data?.tabData?.data;
    const ventaId = filtro?.ventaId ?? this.data?.tabData?.id;
    if (ventaId == null) {
      return;
    }
    this.idVentaControl.setValue(ventaId);
    if (filtro?.sucursalId != null) {
      this.sucursalControl.setValue(filtro.sucursalId);
    }
    this.onFiltrar();
  }


  // Acepta el nro. de venta con o sin separadores de miles (ej: 734.498 -> 734498)
  toVentaId(value: any): number {
    if (value == null || value === '') {
      return null;
    }
    let soloDigitos = String(value).replace(/\D/g, '');
    return soloDigitos.length > 0 ? parseInt(soloDigitos, 10) : null;
  }

  // Deja solo dígitos mientras se tipea o se pega (734.498 -> 734498). No se usa numericOnly porque bloquea Ctrl+V
  onIdVentaInput(event: Event) {
    let input = event.target as HTMLInputElement;
    let soloDigitos = input.value.replace(/\D/g, '');
    if (soloDigitos !== input.value) {
      this.idVentaControl.setValue(soloDigitos);
    }
  }

  onFiltrarConReset() {
    this.pageIndex = 0;
    this.paginator.firstPage();
    this.onFiltrar();
  }

  onFiltrar() {
    this.isLoading = true;
    let fechaInicio = this.fechaInicioControl.value != null ? 
      this.fechaInicioControl.value?.toISOString().slice(0, 10) : null;
    let fechaFin = this.fechaFinControl.value != null ? 
      this.fechaFinControl.value?.toISOString().slice(0, 10) : null;

    this.ventaService
      .onVentasFilter(
        this.toVentaId(this.idVentaControl.value),
        null, // cajaId
        this.pageIndex,
        this.pageSize,
        false, // asc (descending by default)
        this.sucursalControl.value,
        this.formaPagoControl.value,
        this.estadoControl.value,
        this.modoControl.value,
        this.monedaControl.value?.id,
        this.conDescuentoControl.value,
        this.conAumentoControl.value,
        this.conObsControl.value,
        this.selectedCliente?.id,
        fechaInicio,
        fechaFin
      )
      .pipe(untilDestroyed(this))
      .subscribe({ error: () => {
        this.notificacionService.openWarn('No se pudo cargar la lista de ventas: el servidor no responde. Intentá de nuevo.', 5);
        this.vaciarListaSinRespuesta();
      }, next: (res) => {
        this.isLoading = false;
        if (res != null) {
          this.selectedPageInfo = res;
          this.ventaDataSource.data = res.getContent;
          this.onObservado(this.ventaDataSource.data);
          this.ventaDataSource.data = [...this.ventaDataSource.data];
          this.isGenerarReporteDisabled = !res.getContent || res.getContent.length === 0;
        } else {
          this.vaciarListaSinRespuesta(); // error GraphQL: el servicio ya avisó
        }
      } });
  }

  /** Sin filas, paginador ni reporte del filtro anterior a la vista como si fueran del nuevo (#390). */
  private vaciarListaSinRespuesta(): void {
    this.isLoading = false;
    this.selectedPageInfo = null;
    this.ventaDataSource.data = [];
    this.isGenerarReporteDisabled = true;
  }
  
  onClickRow(venta: Venta, index) {
    if (venta.ventaItemList == null) {
      this.isLoading = true;
      this.ventaService
        .onGetPorId(venta.id, venta?.sucursalId, true, true, PROPAGAR_ERROR_DE_RED,
          { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true })
        .pipe(untilDestroyed(this))
        .subscribe({ error: () => {
          this.isLoading = false;
          this.notificacionService.openWarn('No se pudo cargar el detalle de la venta: el servidor no responde.', 5);
        }, next: (res) => {
          this.isLoading = false;
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
  
  onResetFiltro() {
    this.selectedCliente = null;
    this.selectedPageInfo = null;
    this.ventaDataSource.data = [];
    this.modoControl.setValue(null);
    this.estadoControl.setValue(null);
    this.monedaControl.setValue(null);
    this.idVentaControl.setValue(null);
    this.clienteControl.setValue(null);
    this.conObsControl.setValue(false);
    this.sucursalControl.setValue(null);
    this.fechaFinControl.setValue(null);
    this.formaPagoControl.setValue(null);
    this.conAumentoControl.setValue(false);
    this.fechaInicioControl.setValue(null);
    this.conDescuentoControl.setValue(false);
    this.isGenerarReporteDisabled = true;
  }

  getTotales(venta: Venta) {
    this.totalRecibidoGs = 0;
    this.totalRecibidoRs = 0;
    this.totalRecibidoDs = 0;
    this.totalAumento = 0;
    this.totalDescuento = 0;
    this.totalFinal = 0;
    this.totalRecibido = 0;

    venta?.cobro?.cobroDetalleList.forEach((res) => {
      if (res.moneda.denominacion == "GUARANI") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoGs += res.valor;
          this.totalRecibido += res.valor;
          this.totalFinal += res.valor;
        } else if (res.aumento) {
          this.totalAumento += res.valor;
          this.totalFinal += res.valor;
        } else if (res.descuento) this.totalDescuento += res.valor;
      } else if (res.moneda.denominacion == "REAL") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoRs += res.valor;
          this.totalRecibido += res.valor * res.cambio;
          this.totalFinal += res.valor * res.cambio;
        } else if (res.aumento) {
          this.totalAumento += res.valor * res.cambio;
          this.totalFinal += res.valor * res.cambio;
        } else if (res.descuento) {
          this.totalDescuento += res.valor * res.cambio;
        }
      } else if (res.moneda.denominacion == "DOLAR") {
        if (res.pago || res.vuelto) {
          this.totalRecibidoDs += res.valor;
          this.totalRecibido += res.valor * res.cambio;
          this.totalFinal += res.valor * res.cambio;
        } else if (res.aumento) {
          this.totalAumento += res.valor * res.cambio;
          this.totalFinal += res.valor * res.cambio;
        } else if (res.descuento) {
          this.totalDescuento += res.valor * res.cambio;
        }
      }
    });
  }

  onGetBalance() {
    if (this.selectedCaja?.id == null) {
      return;
    }
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

  onClearCliente() {
    this.clienteControl.setValue(null);
    this.selectedCliente = null;
  }

  onSearchCliente() {
    let tableData: TableData[] = [
      {
        id: "id",
        nombre: "Id",
        width: "10%"
      },
      {
        id: "persona.nombre",
        nombre: "Persona",
      },
      {
        id: "persona.documento",
        nombre: "Documento",
      },
    ];
    let data: SearchListtDialogData = {
      titulo: 'Buscar Cliente',
      query: this.clienteSearch,
      tableData: tableData,
      search: true,
      queryData: { texto: this.clienteControl.value},
      inicialSearch: false,
      paginator: true,
    };

    this.matDialog
      .open(SearchListDialogComponent, {
        data: data,
        width: '60%',
        height: '70%',
        
      })
      .afterClosed()
      .subscribe((res: Cliente | any) => {
        if (res != null) {
          this.selectedCliente = res;
          this.clienteControl.setValue(res.persona.nombre);
        }
      });
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

  handlePageEvent(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.onFiltrar();
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
                  error: (err) => console.error('[VentaTarjeta] error al cancelar registro de tarjeta:', err)
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
              // El central respondió que no (por ejemplo, falta el rol): no se aplicó nada y no hay qué confirmar
              if (erroresDeRechazo(e?.error) != null) {
                this.notificacionService.openAlgoSalioMal(mensajeDeError(e.error, `No se pudo ${accion} la venta.`));
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
            error: (err) => console.error('[VentaTarjeta] error al cancelar registro de tarjeta:', err)
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

  onGenerarReporte() {
    let fechaInicio = this.fechaInicioControl.value != null ?
      this.fechaInicioControl.value?.toISOString().slice(0, 10) : null;
    let fechaFin = this.fechaFinControl.value != null ?
      this.fechaFinControl.value?.toISOString().slice(0, 10) : null;

    this.ventaService.onReporteGenericVentas(
      this.toVentaId(this.idVentaControl.value),
      null,
      this.sucursalControl.value,
      this.formaPagoControl.value,
      this.estadoControl.value,
      this.modoControl.value,
      this.monedaControl.value?.id,
      this.conDescuentoControl.value,
      this.conAumentoControl.value,
      this.conObsControl.value,
      this.selectedCliente?.id,
      fechaInicio,
      fechaFin
    );
  }

  onGenerarReporteDetallado() {
    let fechaInicio = this.fechaInicioControl.value != null ?
      this.fechaInicioControl.value?.toISOString().slice(0, 10) : null;
    let fechaFin = this.fechaFinControl.value != null ?
      this.fechaFinControl.value?.toISOString().slice(0, 10) : null;

    this.ventaService.onReporteGenericVentasDetallado(
      this.toVentaId(this.idVentaControl.value),
      null,
      this.sucursalControl.value,
      this.formaPagoControl.value,
      this.estadoControl.value,
      this.modoControl.value,
      this.monedaControl.value?.id,
      this.conDescuentoControl.value,
      this.conAumentoControl.value,
      this.conObsControl.value,
      this.selectedCliente?.id,
      fechaInicio,
      fechaFin
    );
  }
}