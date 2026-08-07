import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UntilDestroy } from '@ngneat/until-destroy';

import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { BuscarStockPorLoteGQL } from './graphql/buscarStockPorLote';
import { CambiarEstadoLoteGQL } from './graphql/cambiarEstadoLote';
import { ClientesPorLoteGQL } from './graphql/clientesPorLote';
import { LotesPorProductoGQL } from './graphql/lotesPorProducto';
import { MovimientosPorLoteGQL } from './graphql/movimientosPorLote';
import { StockLotePorSucursalGQL } from './graphql/stockLotePorSucursal';
import { StockPorLoteGQL } from './graphql/stockPorLote';
import { StockPorLoteEnPresentacionGQL } from './graphql/stockPorLoteEnPresentacion';
import {
  ClienteLote,
  EstadoLote,
  Lote,
  MovimientoLote,
  StockLote,
  StockLotePresentacion,
  StockLoteSucursal
} from './lote.model';

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
    private cambiarEstadoLoteGQL: CambiarEstadoLoteGQL
  ) {}

  /** Lotes de un producto ordenados por FEFO. Incluye bloqueados y en cuarentena. */
  onGetLotesPorProducto(productoId: number, servidor = true): Observable<Lote[]> {
    return this.genericService.onCustomQuery(
      this.lotesPorProductoGQL,
      { productoId },
      servidor
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
    silentLoad = false
  ): Observable<PageInfo<StockLotePresentacion>> {
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
      null,
      silentLoad
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
      null,
      silentLoad
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
      null,
      silentLoad
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
      null,
      silentLoad
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
      null,
      silentLoad
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
}
