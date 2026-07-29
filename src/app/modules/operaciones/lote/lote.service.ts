import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UntilDestroy } from '@ngneat/until-destroy';

import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { BuscarStockPorLoteGQL } from './graphql/buscarStockPorLote';
import { CambiarEstadoLoteGQL } from './graphql/cambiarEstadoLote';
import { LotesPorProductoGQL } from './graphql/lotesPorProducto';
import { StockLotePorSucursalGQL } from './graphql/stockLotePorSucursal';
import { StockPorLoteGQL } from './graphql/stockPorLote';
import { StockPorLoteEnPresentacionGQL } from './graphql/stockPorLoteEnPresentacion';
import { EstadoLote, Lote, StockLote, StockLotePresentacion, StockLoteSucursal } from './lote.model';

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
      estado?: EstadoLote;
      numeroLote?: string;
      texto?: string;
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
        estado: filtros.estado ?? null,
        numeroLote: filtros.numeroLote || null,
        texto: filtros.texto || null,
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
