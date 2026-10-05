import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, of, throwError } from "rxjs";
import { catchError, map, switchMap, tap } from "rxjs/operators";
import {
  ContextoConsulta,
  GenericCrudService,
  QueryError,
  TIMEOUT_CONSULTA_DE_FONDO_MS,
} from "../../../generics/generic-crud.service";
import { esTimeoutDeLink, TIMEOUT_POR_DEFECTO_MS } from "../../../shared/services/timeout-link";
import { MainService } from "../../../main.service";
import { CobroDetalle, CobroDetalleInput } from "./cobro/cobro-detalle.model";
import { Cobro, CobroInput } from "./cobro/cobro.model";
import { VentaEstado } from "./enums/venta-estado.enums";
import { CancelarVentaGQL } from "./graphql/cancelarVenta";
import { ReimprimirVentaGQL } from "./graphql/reimprimirVenta";
import { SaveVentaGQL } from "./graphql/saveVenta";
import { SaveVentaClienteGQL } from "./graphql/saveVentaCliente";
import { VentaPorIdGQL } from "./graphql/ventaPorId";
import { VentaPorCajaIdGQL } from "./graphql/ventasPorCajaId";
import { VentaItem, VentaItemInput } from "./venta-item.model";
import { SaveVentaItemListGQL } from "./venta-item/graphql/saveVentaItemList";
import { Venta, VentaInput } from "./venta.model";
import { VentaPorPeriodoGQL } from "./graphql/ventaPorPeriodo";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { environment } from "../../../../environments/environment";
import { DeleteVentaGQL } from "./graphql/deleteVenta";
import { ImprimirPagareGQL } from "./graphql/imprimirPagare";
import { CountVentaGQL } from "./graphql/count-venta";
import { SaveVentaItemGQL } from "./graphql/saveVentaItem";
import { SaveCobroDetalleGQL } from "./graphql/saveCobroDetalle";
import { DeleteCobroDetalleGQL } from "./graphql/deleteCobroDetalle";
import { DeleteVentaItemGQL } from "./graphql/deleteVentaItem";
import { PageInfo } from "../../../app.component";
import { VentaItemPorIdGQL } from "./graphql/ventaItemPorId";
import { SaveVentaDeliveryGQL } from "./graphql/saveVentaDelivery";
import {
  VentaCreditoInput,
  VentaCreditoCuotaInput,
} from "../../financiero/venta-credito/venta-credito.model";
import { DeliveryInput } from "../delivery/graphql/delivery-input.model";
import { ConfiguracionService } from "../../../shared/services/configuracion.service";
import { ImpresionPosService } from "../../../shared/services/impresion-pos/impresion-pos.service";
import { VentasGenericFilterGQL } from "./graphql/ventasGenericFilter";
import { ReporteGenericVentasGQL } from "./graphql/reporteGenericVentas";
import { ReporteGenericVentasDetalladoGQL } from "./graphql/reporteGenericVentasDetallado";
import { ReporteService } from "../../reportes/reporte.service";
import { TabService } from "../../../layouts/tab/tab.service";
import { Tab } from "../../../layouts/tab/tab.model";
import { ReportesComponent } from "../../reportes/reportes/reportes.component";
import { LucroPorFuncionarioListGQL } from "./graphql/lucroPorFuncionarioList";
import { ReporteLucroPorFuncionarioGQL } from "./graphql/reporteLucroPorFuncionario";

/** Relectura de una venta antes de una acción: error de red al llamador, sin «Ups» propio (#390). */
const RELECTURA_SILENCIOSA: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { show: false },
};
const CONSULTA_RELECTURA: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
/** Listas de ventas: 60 s sin el aviso genérico del link; el error de red llega al llamador, que avisa. */
const PROPAGAR_RED_VENTAS: QueryError = { networkError: { propagate: true, show: false } };
const CONSULTA_LISTA_VENTAS: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };
/** Reportes: conservan su espera larga; solo se propaga el error para poder avisar. */
const REPORTE_PROPAGA: QueryError = { networkError: { propagate: true, show: false } };

export type ResultadoCancelacionVenta =
  /** Se mandó: `aplicada` si el central la alternó, `rechazada` si respondió que no. */
  | { tipo: "aplicada" | "rechazada"; estadoAnterior: VentaEstado }
  /** No se mandó: el central ya tiene otro estado (o ya estaba cancelada). */
  | { tipo: "cambio"; estadoActual: VentaEstado };

export interface ErrorCancelacionVenta {
  /** `lectura`: no se mandó nada. `cancelacion`: pudo haberse aplicado. */
  fase: "lectura" | "cancelacion";
  error: any;
}

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class VentaService {
  ventasBS = new BehaviorSubject<Venta[]>([]);
  ventas$ = this.ventasBS.asObservable();
  
  constructor(
    private genericService: GenericCrudService,
    private saveVenta: SaveVentaGQL,
    private saveVentaItemList: SaveVentaItemListGQL,
    private mainService: MainService,
    private cancelarVenta: CancelarVentaGQL,
    private reimprimirVenta: ReimprimirVentaGQL,
    private ventasPorCajaId: VentaPorCajaIdGQL,
    private ventaPorId: VentaPorIdGQL,
    private ventaPorPeriodo: VentaPorPeriodoGQL,
    private notificacionBar: NotificacionSnackbarService,
    private deleteVenta: DeleteVentaGQL,
    private deleteVentaItem: DeleteVentaItemGQL,
    private imprimirPagare: ImprimirPagareGQL,
    private countVenta: CountVentaGQL,
    private saveVentaItemQuery: SaveVentaItemGQL,
    private saveCobroDetalleQuery: SaveCobroDetalleGQL,
    private deleteCobroDetalle: DeleteCobroDetalleGQL,
    private ventaItemPorId: VentaItemPorIdGQL,
    private saveVentaDelivery: SaveVentaDeliveryGQL,
    private configService: ConfiguracionService,
    private ventasGenericFilter: VentasGenericFilterGQL,
    private reporteGenericVentas: ReporteGenericVentasGQL,
    private reporteGenericVentasDetallado: ReporteGenericVentasDetalladoGQL,
    private reporteService: ReporteService,
    private tabService: TabService,
    private lucroPorFuncionarioList: LucroPorFuncionarioListGQL,
    private reporteLucroPorFuncionario: ReporteLucroPorFuncionarioGQL,
    private saveVentaCliente: SaveVentaClienteGQL,
    private impresionPos: ImpresionPosService
  ) { }

  // $venta:VentaInput!, $venteItemList: [VentaItemInput], $cobro: CobroInput, $cobroDetalleList: [CobroDetalleInput]

  onSaveVentaDelivery(
    ventaInput: VentaInput,
    deliveryInput: DeliveryInput,
    cobroDetalleList?: CobroDetalleInput[],
    ventaCreditoInput?: VentaCreditoInput,
    ventaCreditoCuotaInputList?: VentaCreditoCuotaInput[],
    servidor = true
  ) {
    return this.genericService.onCustomMutation(this.saveVentaDelivery, {
      ventaInput,
      deliveryInput,
      cobroDetalleList,
      ventaCreditoInput,
      ventaCreditoCuotaInputList,
    }, servidor);
  }

  setVentas(ventas: Venta[]): void {
    this.ventasBS.next(ventas);
  }

  onSaveVenta(
    venta: Venta,
    cobro: Cobro,
    ticket,
    ventaCreditoInput?,
    ventaCreditoCuotaInputList?,
    isFactura?: boolean,
    servidor = true
  ): Observable<Venta> {
    let ventaItemInputList: VentaItemInput[] = [];
    let cobroDetalleInputList: CobroDetalleInput[] = [];
    let ventaInput: VentaInput = venta.toInput();
    let cobroInput: CobroInput = cobro.toInput();
    ventaInput.estado = VentaEstado.CONCLUIDA;
    ventaInput.usuarioId = this.mainService?.usuarioActual?.id;
    cobroInput.usuarioId = this.mainService?.usuarioActual?.id;

    venta.ventaItemList.forEach((e) => {
      let aux = new VentaItem();
      ventaItemInputList.push(Object.assign(aux, e).toInput());
    });
    cobro.cobroDetalleList.forEach((e) => {
      let aux = new CobroDetalle();
      cobroDetalleInputList.push(Object.assign(aux, e).toInput());
    });

    if (this.impresionPos.porCliente(servidor)) {
      // "Imprimir desde esta PC": misma venta, la filial devuelve el comprobante y se imprime acá.
      // La impresión va aparte: la venta se entrega apenas se guardó, sin esperar el papel.
      return this.genericService.onCustomMutation(this.saveVentaCliente, {
        ventaInput: ventaInput,
        ventaItemList: ventaItemInputList,
        cobro: cobroInput,
        cobroDetalleList: cobroDetalleInputList,
        ticket,
        facturar: isFactura,
        local: this.configService?.getConfig()?.local,
        pdvId: this.configService?.getConfig()?.pdvId,
        ventaCreditoInput,
        ventaCreditoCuotaInputList,
      }, servidor).pipe(
        tap((res: Venta) => this.impresionPos.imprimir(res?.ticketEscpos, "El comprobante de la venta").subscribe())
      );
    }

    return this.genericService.onCustomMutation(this.saveVenta, {
      ventaInput: ventaInput,
      ventaItemList: ventaItemInputList,
      cobro: cobroInput,
      cobroDetalleList: cobroDetalleInputList,
      ticket,
      facturar: isFactura,
      printerName: this.configService?.getConfig()?.printers?.ticket,
      local: this.configService?.getConfig()?.local,
      pdvId: this.configService?.getConfig()?.pdvId,
      ventaCreditoInput,
      ventaCreditoCuotaInputList,
    }, servidor);
  }

  onSaveVenta2(ventaInput?: VentaInput, servidor = true): Observable<Venta> {
    return this.genericService.onCustomMutation(this.saveVenta, {
      ventaInput: ventaInput,
    }, servidor);
  }

  onDeleteVenta(id, servidor = true): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteVenta,
      id,
      "¿Eliminar venta?",
      null,
      false,
      servidor,
      "¿Está seguro que desea eliminar esta venta?"
    );
  }

  onDeleteVentaItem(id, sucId, servidor = true): Observable<boolean> {
    return this.genericService.onDeleteWithSucId(
      this.deleteVentaItem,
      id,
      sucId,
      null,
      null,
      false,
      false
    );
  }

  onReimprimirVenta(id, servidor = true): Observable<boolean> {
    if (this.impresionPos.porCliente(servidor)) {
      // null si no salió: quien llama solo avisa "Reimpreso con éxito" con un resultado no nulo.
      return this.impresionPos
        .imprimirTicket("VENTA", id, "La reimpresión de la venta")
        .pipe(map((ok) => (ok ? true : null)));
    }
    return this.genericService.onCustomMutation(
      this.reimprimirVenta,
      {
        id,
        printerName: this.configService?.getConfig()?.printers?.ticket,
        local: this.configService?.getConfig()?.local,
      },
      servidor
    );
  }

  onImprimirPagare(id, itens, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.imprimirPagare,
      {
        id,
        itens,
        printerName: this.configService?.getConfig()?.printers?.ticket,
        local: this.configService?.getConfig()?.local,
      },
      servidor
    );
  }

  onCancelarVenta(id, sucId, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(this.cancelarVenta, { id, sucId }, servidor);
  }

  /**
   * Cancela (o reactiva) una venta verificando antes su estado en el CENTRAL.
   *
   * El central ALTERNA: una venta CANCELADA vuelve a CONCLUIDA y cualquier otra pasa a CANCELADA, con su caja y su
   * stock. Mandarlo según el estado de una fila vieja —otro usuario ya la canceló, o un intento anterior se aplicó
   * y se perdió la respuesta— hace lo contrario de lo que se confirmó (#390). Por eso se relee y solo se manda si
   * el estado es el esperado.
   *
   * - `estadoEsperado`: el de la fila. Si el central tiene otro, no se manda (`tipo: 'cambio'`).
   * - `soloCancelar`: para pantallas que no ofrecen reactivar; si ya está CANCELADA no se manda.
   *
   * Errores (por `error:`): `{ fase: 'lectura' }` = no se pudo leer, NO se mandó nada; `{ fase: 'cancelacion' }` =
   * la mutación falló o no respondió: pudo haberse aplicado, hay que releer antes de reintentar.
   */
  onCancelarVentaVerificando(
    id,
    sucId,
    opciones: { estadoEsperado?: VentaEstado; soloCancelar?: boolean } = {}
  ): Observable<ResultadoCancelacionVenta> {
    return this.onLeerEstadoEnCentral(id, sucId).pipe(
      catchError((error) => throwError(() => ({ fase: "lectura", error } as ErrorCancelacionVenta))),
      switchMap((estadoActual) => {
        const cambio = opciones.estadoEsperado != null && estadoActual != opciones.estadoEsperado;
        const yaCancelada = opciones.soloCancelar === true && estadoActual == VentaEstado.CANCELADA;
        if (cambio || yaCancelada) {
          return of({ tipo: "cambio", estadoActual } as ResultadoCancelacionVenta);
        }
        return this.onCancelarVenta(id, sucId, true).pipe(
          map((ok) => ({ tipo: ok ? "aplicada" : "rechazada", estadoAnterior: estadoActual } as ResultadoCancelacionVenta)),
          catchError((error) => throwError(() => ({ fase: "cancelacion", error } as ErrorCancelacionVenta)))
        );
      })
    );
  }

  /**
   * Estado de la venta en el central, sin modal ni avisos propios (el aviso lo da el llamador). Falla (por
   * `error:`) si no responde o no se pudo leer: nunca devuelve un estado inventado.
   */
  onLeerEstadoEnCentral(id, sucId): Observable<VentaEstado> {
    return this.onGetPorId(id, sucId, true, true, RELECTURA_SILENCIOSA, CONSULTA_RELECTURA).pipe(
      switchMap((venta) =>
        venta?.estado != null ? of(venta.estado) : throwError(() => new Error("No se pudo leer la venta"))
      )
    );
  }

  onSearch(
    idVenta,
    idCaja,
    page?,
    size?,
    asc?,
    sucId?,
    formaPago?,
    estado?,
    isDelivery?,
    monedaId?,
    conDescuento?,
    conAumento?,
    servidor = true,
    errorConf?: QueryError,
    silentLoad?: boolean,
    contexto?: ContextoConsulta
  ): Observable<PageInfo<Venta>> {
    return this.genericService.onCustomQuery(this.ventasPorCajaId, {
      idVenta,
      idCaja,
      page,
      size,
      asc,
      sucId,
      formaPago,
      estado,
      isDelivery,
      monedaId,
      conDescuento,
      conAumento
    }, servidor, errorConf, silentLoad, contexto);
  }

  onVentasFilter(
    idVenta?,
    idCaja?,
    page?,
    size?,
    asc?,
    sucId?,
    formaPago?,
    estado?,
    isDelivery?,
    monedaId?,
    conDescuento?,
    conAumento?,
    conObservacion?,
    clienteId?,
    fechaInicio?,
    fechaFin?,
    servidor = true
  ): Observable<PageInfo<Venta>> {
    return this.genericService.onCustomQuery(this.ventasGenericFilter, {
      idVenta,
      idCaja,
      page,
      size,
      asc,
      sucId,
      formaPago,
      estado,
      isDelivery,
      monedaId,
      conDescuento,
      conAumento,
      conObservacion,
      clienteId,
      fechaInicio,
      fechaFin
    }, servidor, PROPAGAR_RED_VENTAS, true, CONSULTA_LISTA_VENTAS);
  }

  onReporteGenericVentas(
    idVenta?: number,
    idCaja?: number,
    sucId?: number,
    formaPago?: number,
    estado?: string,
    isDelivery?: boolean,
    monedaId?: number,
    conDescuento?: boolean,
    conAumento?: boolean,
    conObservacion?: boolean,
    clienteId?: number,
    fechaInicio?: string,
    fechaFin?: string,
    servidor = true
  ) {
    this.genericService
      .onCustomQuery(
        this.reporteGenericVentas,
        {
          idVenta,
          idCaja,
          sucId,
          formaPago,
          estado,
          isDelivery,
          monedaId,
          conDescuento,
          conAumento,
          conObservacion,
          clienteId,
          fechaInicio,
          fechaFin,
          usuarioId: this.mainService?.usuarioActual?.id
        },
        servidor,
        REPORTE_PROPAGA
      )
      .subscribe({ error: (err) => this.avisarReporteFallido(err), next: (res: string) => {
        if (res != null) {
          this.reporteService.onAdd('Reporte de Ventas ' + Date.now(), res);
          this.tabService.addTab(
            new Tab(ReportesComponent, 'Reportes', null, null)
          );
        }
      } });
  }

  onReporteGenericVentasDetallado(
    idVenta?: number,
    idCaja?: number,
    sucId?: number,
    formaPago?: number,
    estado?: string,
    isDelivery?: boolean,
    monedaId?: number,
    conDescuento?: boolean,
    conAumento?: boolean,
    conObservacion?: boolean,
    clienteId?: number,
    fechaInicio?: string,
    fechaFin?: string,
    servidor = true
  ) {
    this.genericService
      .onCustomQuery(
        this.reporteGenericVentasDetallado,
        {
          idVenta,
          idCaja,
          sucId,
          formaPago,
          estado,
          isDelivery,
          monedaId,
          conDescuento,
          conAumento,
          conObservacion,
          clienteId,
          fechaInicio,
          fechaFin,
          usuarioId: this.mainService?.usuarioActual?.id
        },
        servidor,
        REPORTE_PROPAGA
      )
      .subscribe({ error: (err) => this.avisarReporteFallido(err), next: (res: string) => {
        if (res != null) {
          this.reporteService.onAdd('Reporte Detallado de Ventas ' + Date.now(), res);
          this.tabService.addTab(
            new Tab(ReportesComponent, 'Reportes', null, null)
          );
        }
      } });
  }

  /** Un reporte que no responde: antes no pasaba nada. El corte por tiempo ya lo avisa el link (#390). */
  private avisarReporteFallido(err: any): void {
    if (esTimeoutDeLink(err)) return;
    this.notificacionBar.openWarn('No se pudo generar el reporte: el servidor no responde. Intentá de nuevo.', 5);
  }

  onGetPorId(id, sucId?, silentLoad?, servidor = true, errorConf?: QueryError,
             contexto?: ContextoConsulta): Observable<Venta> {
    return this.genericService.onGetById(
      this.ventaPorId,
      id,
      null,
      null, servidor,
      sucId,
      null,
      null,
      silentLoad,
      null,
      null,
      errorConf,
      contexto
    );
  }

  onGetVentasPorPeriodo(inicio: string, fin: string, sucId?, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(
      this.ventaPorPeriodo,
      { inicio, fin, sucId },
      servidor
    );
  }

  onCountVenta(servidor = true): Observable<number> {
    return this.genericService.onCustomQuery(this.countVenta, null, servidor);
  }

  onSaveVentaItem(ventaItemInput: VentaItemInput, servidor = true): Observable<any> {
    return this.genericService.onSave(this.saveVentaItemQuery, ventaItemInput, null, null, servidor);
  }

  onSaveCobroDetalle(
    cobroDetalleInput: CobroDetalleInput,
    servidor = true
  ): Observable<CobroDetalle> {
    // Sin propagar, un error de red no emitía y la línea quedaba sumada al saldo sin registrarse. Sus dos
    // llamadores (cobro de un delivery en edit-delivery y pago-touch) revierten en su error: (#390)
    return this.genericService.onSave(
      this.saveCobroDetalleQuery,
      cobroDetalleInput,
      null,
      null,
      servidor,
      { networkError: { propagate: true } }
    );
  }

  onDeleteCobroDetalle(id, sucId, servidor = true): Observable<boolean> {
    return this.genericService.onDeleteWithSucId(
      this.deleteCobroDetalle,
      id,
      sucId,
      null,
      null,
      false,
      servidor
    );
  }

  onGetVentaItemPorId(id, sucId, servidor = true): Observable<VentaItem> {
    return this.genericService.onGetById(
      this.ventaItemPorId,
      id,
      null,
      null,
      servidor,
      sucId
    );
  }

  onSetObservado(ventaObs: Venta) {
    const ventas = this.ventasBS.getValue();
    const index = ventas.findIndex(v => v.id === ventaObs.id);
    if (index >= 0) {
      ventas[index] = ventaObs;
      this.ventasBS.next([...ventas]);
    }
  }

  onImprimirReporteLucroPorFuncionario(
    fechaInicio: string,
    fechaFin: string,
    sucursalIdList?: number[],
    usuarioIdList?: number[],
    productoIdList?: number[],
    subfamiliaId?: number,
    servidor = true,
    familiaId?: number
  ) {
    this.genericService
      .onCustomQuery(
        this.reporteLucroPorFuncionario,
        {
          fechaInicio,
          fechaFin,
          sucursalIdList,
          usuarioId: this.mainService.usuarioActual.id,
          usuarioIdList,
          productoIdList,
          subfamiliaId,
          familiaId
        },
        servidor,
        REPORTE_PROPAGA
      )
      .subscribe({ error: (err) => this.avisarReporteFallido(err), next: (res) => {
        if (res != null) {
          this.reporteService.onAdd("Lucro por funcionario " + Date.now(), res);
          this.tabService.addTab(
            new Tab(ReportesComponent, "Reportes", null, null)
          );
        }
      } });
  }

  onGetLucroPorFuncionario(
    fechaInicio: string,
    fechaFin: string,
    sucursalIdList: number[],
    usuarioIdList: number[],
    productoIdList: number[],
    subfamiliaId?: number,
    page?: number,
    size?: number,
    familiaId?: number,
    servidor = true
  ): Observable<any> {
    return this.genericService.onCustomQuery(this.lucroPorFuncionarioList, {
      fechaInicio,
      fechaFin,
      sucursalIdList,
      usuarioIdList,
      productoIdList,
      subfamiliaId,
      page,
      size,
      familiaId
    }, servidor, REPORTE_PROPAGA);
  }
}
