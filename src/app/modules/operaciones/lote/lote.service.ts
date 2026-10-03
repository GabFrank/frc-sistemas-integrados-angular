import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { UntilDestroy } from '@ngneat/until-destroy';

import { PageInfo } from '../../../app.component';
import {
  ContextoConsulta,
  GenericCrudService,
  PROPAGAR_ERROR_DE_RED,
  QueryError,
  TIMEOUT_CONSULTA_DE_FONDO_MS,
} from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import {
  SearchListDialogComponent,
  SearchListtDialogData,
  TableData
} from '../../../shared/components/search-list-dialog/search-list-dialog.component';
import { AjustarStockLoteGQL } from './graphql/ajustarStockLote';
import { BuscarLotesDeProductoGQL } from './graphql/buscarLotesDeProducto';
import { ResumenStockLoteGQL } from './graphql/resumenStockLote';
import { BuscarStockPorLoteGQL } from './graphql/buscarStockPorLote';
import { CambiarEstadoLoteGQL } from './graphql/cambiarEstadoLote';
import { ClientesPorLoteGQL } from './graphql/clientesPorLote';
import { LotesPorProductoGQL } from './graphql/lotesPorProducto';
import { MovimientosPorLoteGQL } from './graphql/movimientosPorLote';
import { StockLotePorSucursalGQL } from './graphql/stockLotePorSucursal';
import { StockPorLoteGQL } from './graphql/stockPorLote';
import { StockPorLoteEnPresentacionGQL } from './graphql/stockPorLoteEnPresentacion';
import {
  AjusteStockLoteInput,
  AjusteStockLoteResultado,
  ClienteLote,
  EstadoLote,
  Lote,
  LoteDeProducto,
  MovimientoLote,
  ResumenStockLote,
  StockLote,
  StockLotePresentacion,
  StockLoteSucursal
} from './lote.model';
/** Consultas de lotes: el error de red llega al llamador, que avisa (#390). 20 s en diálogos, 60 s en listados. */
const CONSULTA_DIALOGO_LOTE: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };
const CONSULTA_LISTADO_LOTE: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };

/**
 * Maestro de lotes: consulta y administración del estado.
 *
 * Las filas del ledger de stock por lote se generan en el backend (recepción de mercadería y,
 * en filiales, venta con FEFO). Desde acá solo se consulta y se bloquea/libera un lote.
 */
@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class LoteService {
  constructor(
    private genericService: GenericCrudService,
    private lotesPorProductoGQL: LotesPorProductoGQL,
    private stockPorLoteGQL: StockPorLoteGQL,
    private stockPorLoteEnPresentacionGQL: StockPorLoteEnPresentacionGQL,
    private buscarStockPorLoteGQL: BuscarStockPorLoteGQL,
    private stockLotePorSucursalGQL: StockLotePorSucursalGQL,
    private movimientosPorLoteGQL: MovimientosPorLoteGQL,
    private clientesPorLoteGQL: ClientesPorLoteGQL,
    private cambiarEstadoLoteGQL: CambiarEstadoLoteGQL,
    private resumenStockLoteGQL: ResumenStockLoteGQL,
    private ajustarStockLoteGQL: AjustarStockLoteGQL,
    private buscarLotesDeProductoGQL: BuscarLotesDeProductoGQL,
    private dialog: MatDialog
  ) {}

  /** Lotes de un producto ordenados por FEFO. Incluye bloqueados y en cuarentena. */
  onGetLotesPorProducto(productoId: number, servidor = true, errorConf?: QueryError,
                        contexto?: ContextoConsulta): Observable<Lote[]> {
    // Propaga por defecto (#390); recepción pasa los suyos
    return this.genericService.onCustomQuery(
      this.lotesPorProductoGQL,
      { productoId },
      servidor,
      errorConf ?? PROPAGAR_ERROR_DE_RED,
      undefined,
      contexto ?? CONSULTA_LISTADO_LOTE
    );
  }

  /** Saldo disponible por lote de un producto en una sucursal. */
  onGetStockPorLote(productoId: number, sucursalId: number, servidor = true): Observable<StockLote[]> {
    return this.genericService.onCustomQuery(
      this.stockPorLoteGQL,
      { productoId, sucursalId },
      servidor
    );
  }

  /**
   * Saldo por lote ya expresado en una presentación, paginado desde el backend.
   *
   * La conversión unidades/presentación y el filtro por número de lote los resuelve el servidor:
   * con paginación server-side, filtrar en la pantalla solo alcanzaría a la página visible.
   */
  onGetStockPorLoteEnPresentacion(
    productoId: number,
    sucursalId: number,
    presentacionId: number,
    numeroLote?: string,
    page = 0,
    size = 10,
    servidor = true,
    silentLoad = false,
    timeoutMs?: number
  ): Observable<PageInfo<StockLotePresentacion>> {
    // Propaga el error de red: los tres que llaman (los dos del diálogo de lote del POS y el de
    // transferencias) tienen `error:`. Sin esto quedaban "cargando" para siempre (#390).
    return this.genericService.onCustomQuery(
      this.stockPorLoteEnPresentacionGQL,
      {
        productoId,
        sucursalId,
        presentacionId: presentacionId ?? null,
        numeroLote: numeroLote || null,
        page,
        size
      },
      servidor,
      PROPAGAR_ERROR_DE_RED,
      silentLoad,
      timeoutMs != null ? { timeoutMs, silenciarAvisoTimeout: true } : undefined
    );
  }

  /**
   * Consulta general "¿dónde tengo qué?". Todos los filtros son opcionales:
   * los valores nulos se ignoran en el backend.
   */
  onBuscarStockPorLote(
    filtros: {
      productoId?: number;
      sucursalId?: number;
      proveedorId?: number;
      estado?: EstadoLote;
      numeroLote?: string;
      texto?: string;
      /** Piso del corte por fecha. Con el tope arman una ventana; cada uno vale por separado. */
      vencimientoDesde?: string;
      vencimientoHasta?: string;
    },
    page = 0,
    size = 20,
    servidor = true,
    silentLoad = false
  ): Observable<PageInfo<StockLote>> {
    return this.genericService.onCustomQuery(
      this.buscarStockPorLoteGQL,
      {
        productoId: filtros.productoId ?? null,
        sucursalId: filtros.sucursalId ?? null,
        proveedorId: filtros.proveedorId ?? null,
        estado: filtros.estado ?? null,
        numeroLote: filtros.numeroLote || null,
        texto: filtros.texto || null,
        vencimientoDesde: filtros.vencimientoDesde || null,
        vencimientoHasta: filtros.vencimientoHasta || null,
        page,
        size
      },
      servidor,
      PROPAGAR_ERROR_DE_RED,
      silentLoad,
      CONSULTA_LISTADO_LOTE
    );
  }

  /**
   * Desglose por sucursal del saldo de un lote. Incluye las sucursales sin stock, con cantidad 0.
   *
   * Se pide aparte y no junto con el listado porque solo hace falta cuando el operador expande
   * una fila: traerlo para las 20 filas de la página sería trabajo tirado en la mayoría de los
   * casos.
   */
  onStockLotePorSucursal(
    loteId: number,
    servidor = true,
    silentLoad = true
  ): Observable<StockLoteSucursal[]> {
    return this.genericService.onCustomQuery(
      this.stockLotePorSucursalGQL,
      { loteId },
      servidor,
      PROPAGAR_ERROR_DE_RED,
      silentLoad,
      CONSULTA_DIALOGO_LOTE
    );
  }

  /**
   * Historial de un lote, del movimiento más reciente al más viejo.
   *
   * Con sucursalId nulo trae el recorrido completo por la red. Va paginado desde el backend: un
   * lote de rotación alta acumula una fila por venta, y traerlas todas para mostrar las primeras
   * veinte sería trabajo tirado.
   */
  onMovimientosPorLote(
    loteId: number,
    sucursalId?: number,
    tipoMovimiento?: string,
    page = 0,
    size = 20,
    servidor = true,
    silentLoad = true
  ): Observable<PageInfo<MovimientoLote>> {
    return this.genericService.onCustomQuery(
      this.movimientosPorLoteGQL,
      {
        loteId,
        sucursalId: sucursalId ?? null,
        tipoMovimiento: tipoMovimiento || null,
        page,
        size
      },
      servidor,
      PROPAGAR_ERROR_DE_RED,
      silentLoad,
      CONSULTA_LISTADO_LOTE
    );
  }

  /**
   * A qué clientes se les vendió el lote, una fila por venta, de la más reciente a la más vieja.
   *
   * rastreable parte el resultado en dos conjuntos que no se solapan: en true las ventas con
   * cliente identificado, en false las de mostrador.
   */
  onClientesPorLote(
    loteId: number,
    sucursalId?: number,
    rastreable = true,
    page = 0,
    size = 20,
    servidor = true,
    silentLoad = true
  ): Observable<PageInfo<ClienteLote>> {
    return this.genericService.onCustomQuery(
      this.clientesPorLoteGQL,
      { loteId, sucursalId: sucursalId ?? null, rastreable, page, size },
      servidor,
      PROPAGAR_ERROR_DE_RED,
      silentLoad,
      CONSULTA_LISTADO_LOTE
    );
  }


  /**
   * Cambia el estado de un lote. Pasar a BLOQUEADO es el mecanismo de recall: lo saca de FEFO
   * y del mostrador en todas las sucursales, sin tocar el stock físico.
   */
  onCambiarEstadoLote(
    loteId: number,
    estado: EstadoLote,
    observacion: string,
    usuarioId: number,
    servidor = true
  ): Observable<Lote> {
    return this.genericService.onCustomMutation(
      this.cambiarEstadoLoteGQL,
      { loteId, estado, observacion, usuarioId },
      servidor
    );
  }

  /**
   * Página del buscador de lotes, sin abrir ningún diálogo.
   *
   * Se usa para releer el saldo del lote elegido cuando cambia la sucursal: el saldo es por
   * sucursal, así que el número que quedó de la elección anterior deja de valer.
   */
  onBuscarLotesDeProducto(
    productoId: number,
    sucursalId: number,
    texto?: string,
    page = 0,
    size = 10,
    servidor = true,
    silentLoad = true
  ): Observable<PageInfo<LoteDeProducto>> {
    return this.genericService.onCustomQuery(
      this.buscarLotesDeProductoGQL,
      { productoId, sucursalId: sucursalId ?? null, texto: texto || null, page, size },
      servidor,
      PROPAGAR_ERROR_DE_RED,
      silentLoad,
      CONSULTA_DIALOGO_LOTE
    );
  }

  /**
   * Abre el buscador genérico para elegir un lote del producto.
   *
   * Va contra el buscador paginado del backend y no contra una lista traída entera: un producto de
   * rotación alta acumula un lote por recepción, así que un combo deja de servir apenas pasan unas
   * decenas.
   *
   * Devuelve el lote elegido, o nada si el operador cerró sin elegir.
   */
  onBuscarLoteDeProducto(
    productoId: number,
    sucursalId: number,
    texto?: string
  ): Observable<LoteDeProducto> {
    const tableData: TableData[] = [
      { id: 'numeroLote', nombre: 'Nº de Lote' },
      { id: 'fechaVencimiento', nombre: 'Vencimiento', pipe: 'date', pipeArgs: 'dd/MM/yyyy' },
      { id: 'fechaRetiro', nombre: 'Retiro', pipe: 'date', pipeArgs: 'dd/MM/yyyy' },
      { id: 'estado', nombre: 'Estado' },
      // Los dos saldos juntos: sin el total, un lote que tiene mercadería en otro depósito se ve
      // igual que uno agotado y el cero de esta sucursal parece un error de la consulta.
      { id: 'saldo', nombre: 'Saldo aquí (unid.)', pipe: 'number', pipeArgs: '1.0-2' },
      { id: 'saldoTotal', nombre: 'Saldo total (unid.)', pipe: 'number', pipeArgs: '1.0-2' }
    ];

    const data: SearchListtDialogData = {
      query: this.buscarLotesDeProductoGQL,
      tableData,
      titulo: 'Buscar lote',
      search: true,
      texto,
      inicialSearch: true,
      paginator: true,
      textHint: 'Nº de lote',
      queryData: {
        productoId,
        sucursalId,
        texto: texto || null,
        page: 0,
        size: 10
      }
    };

    return new Observable<LoteDeProducto>((observer) => {
      this.dialog
        .open(SearchListDialogComponent, { data, width: '60%', height: '70%' })
        .afterClosed()
        .subscribe({
          next: (res) => {
            observer.next(res?.loteId != null ? res : null);
            observer.complete();
          },
          error: (error) => observer.error(error)
        });
    });
  }

  /**
   * Las tres cuentas del producto en una sucursal: existencia, lo atribuido a lotes reales y lo
   * que quedó sin trazar. Viene calculado del backend para que la pantalla no tenga que restar
   * dos consultas y equivocarse.
   */
  onResumenStockLote(
    productoId: number,
    sucursalId: number,
    servidor = true,
    silentLoad = true
  ): Observable<ResumenStockLote> {
    return this.genericService.onCustomQuery(
      this.resumenStockLoteGQL,
      { productoId, sucursalId },
      servidor,
      PROPAGAR_ERROR_DE_RED,
      silentLoad,
      CONSULTA_DIALOGO_LOTE
    );
  }

  /**
   * Ajusta el stock de un lote. El backend escribe el movimiento agregado y su desglose por lote
   * en la misma transacción, así que la existencia total y el stock por lote no pueden quedar
   * contando cosas distintas.
   */
  onAjustarStockLote(
    input: AjusteStockLoteInput,
    servidor = true
  ): Observable<AjusteStockLoteResultado> {
    return this.genericService.onCustomMutation(
      this.ajustarStockLoteGQL,
      { input },
      servidor
    );
  }
}
