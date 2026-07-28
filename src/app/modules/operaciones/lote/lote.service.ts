import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UntilDestroy } from '@ngneat/until-destroy';

import { PageInfo } from '../../../app.component';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { BuscarStockPorLoteGQL } from './graphql/buscarStockPorLote';
import { CambiarEstadoLoteGQL } from './graphql/cambiarEstadoLote';
import { LotesPorProductoGQL } from './graphql/lotesPorProducto';
import { StockPorLoteGQL } from './graphql/stockPorLote';
import { EstadoLote, Lote, StockLote } from './lote.model';

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
    private buscarStockPorLoteGQL: BuscarStockPorLoteGQL,
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
