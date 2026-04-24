import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Pago, PagoEstado } from './pago.model';
import { PagoQuery } from './graphql/pago';
import { SavePagoMutation } from './graphql/savePago';
import { PagoConFiltrosQuery } from './graphql/pagoConFiltros';
import { PageInfo } from '../../../app.component';

@Injectable({
  providedIn: 'root'
})
export class PagoService {

  constructor(
    private genericService: GenericCrudService,
    private getPago: PagoQuery,
    private savePagoMutation: SavePagoMutation,
    private pagoConFiltrosQuery: PagoConFiltrosQuery,
    // private notaRecepcionPorAgrupadaQuery: NotaRecepcionPorAgrupadaQuery
  ) { }

  /**
   * Obtiene un pago por su ID
   * @param id ID del pago
   * @returns Observable con el pago
   */
  onGetPago(id): Observable<Pago> {
    return this.genericService.onGetById(this.getPago, id);
  }

  /**
   * Guarda un pago
   * @param input Datos del pago a guardar
   * @returns Observable con el pago guardado
   */
  onSavePago(input): Observable<Pago> {
    return this.genericService.onSave(this.savePagoMutation, input);
  }

  /**
   * Obtiene las notas de recepción asociadas a una nota de recepción agrupada
   * @param notaRecepcionAgrupadaId ID de la nota de recepción agrupada
   * @returns Observable con lista de notas de recepción
   */
  // onGetNotasRecepcionPorAgrupada(notaRecepcionAgrupadaId: number): Observable<NotaRecepcion[]> {
  //   return this.genericService.onCustomQuery(
  //     this.notaRecepcionPorAgrupadaQuery,
  //     {
  //       id: notaRecepcionAgrupadaId.toString()
  //     }
  //   );
  // }

  /**
   * Busca pagos aplicando filtros
   * @param pagoId ID directo del pago (opcional)
   * @param solicitudPagoId ID de la solicitud de pago relacionada (opcional)
   * @param estado Estado del pago (opcional)
   * @param programado Filtrar por pagos programados (opcional)
   * @param fechaInicio Fecha de inicio para filtrar (opcional)
   * @param fechaFin Fecha de fin para filtrar (opcional)
   * @param pageIndex Índice de página
   * @param pageSize Tamaño de página
   * @returns Observable con página de resultados
   */
  onSearchConFiltros(
    pagoId?: number,
    solicitudPagoId?: number,
    estado?: PagoEstado,
    programado?: boolean,
    fechaInicio?: string,
    fechaFin?: string,
    pageIndex = 0,
    pageSize = 25
  ): Observable<PageInfo<Pago>> {
    // Convert IDs to strings if provided, otherwise null
    const pagoIdStr = pagoId ? pagoId.toString() : null;
    const solicitudPagoIdStr = solicitudPagoId ? solicitudPagoId.toString() : null;

    return this.genericService.onCustomQuery(
      this.pagoConFiltrosQuery,
      {
        pagoId: pagoIdStr,
        solicitudPagoId: solicitudPagoIdStr,
        estado: estado || null,
        programado: programado !== undefined ? programado : null,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        page: pageIndex,
        size: pageSize,
      }
    );
  }
} 