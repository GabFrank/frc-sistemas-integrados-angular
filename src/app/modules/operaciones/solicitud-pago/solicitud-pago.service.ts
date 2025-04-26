import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { SolicitudPago, SolicitudPagoEstado, TipoSolicitudPago } from './solicitud-pago.model';
import { SolicitudPagoQuery } from './graphql/solicitudPago';
import { SolicitudPagoPorUsuarioIdQuery } from './graphql/solicitudPagoPorUsuarioId';
import { SaveSolicitudPagoMutation } from './graphql/saveSolicitudPago';
import { SolicitudPagoConFiltrosQuery } from './graphql/solicitudPagoConFiltros';
import { PageInfo } from '../../../app.component';

@Injectable({
  providedIn: 'root'
})
export class SolicitudPagoService {

  constructor(
    private genericService: GenericCrudService,
    private getSolicitudPago: SolicitudPagoQuery,
    private getSolicitudPagoPorUsuarioId: SolicitudPagoPorUsuarioIdQuery,
    private saveSolicitudPagoMutation: SaveSolicitudPagoMutation,
    private solicitudPagoConFiltrosQuery: SolicitudPagoConFiltrosQuery
  ) { }

  /**
   * Obtiene una solicitud de pago por su ID
   * @param id ID de la solicitud de pago
   * @returns Observable con la solicitud de pago
   */
  onGetSolicitudPago(id): Observable<SolicitudPago> {
    return this.genericService.onGetById(this.getSolicitudPago, id);
  }

  /**
   * Obtiene las solicitudes de pago de un usuario por su ID
   * @param usuarioId ID del usuario
   * @returns Observable con un array de solicitudes de pago
   */
  onGetSolicitudPagoPorUsuarioId(usuarioId): Observable<SolicitudPago[]> {
    return this.genericService.onGetById(this.getSolicitudPagoPorUsuarioId, usuarioId);
  }

  /**
   * Guarda una solicitud de pago
   * @param input Datos de la solicitud de pago a guardar
   * @returns Observable con la solicitud de pago guardada
   */
  onSaveSolicitudPago(input): Observable<SolicitudPago> {
    return this.genericService.onSave(this.saveSolicitudPagoMutation, { entity: input });
  }

  /**
   * Busca solicitudes de pago aplicando filtros
   * @param solicitudPagoId ID directo de la solicitud de pago (opcional)
   * @param referenciaId ID de referencia a buscar (opcional)
   * @param tipo Tipo de solicitud de pago (opcional)
   * @param estado Estado de la solicitud de pago (opcional)
   * @param fechaInicio Fecha de inicio para filtrar (opcional)
   * @param fechaFin Fecha de fin para filtrar (opcional)
   * @param pageIndex Índice de página
   * @param pageSize Tamaño de página
   * @returns Observable con página de resultados
   */
  onSearchConFiltros(
    solicitudPagoId?: number,
    referenciaId?: string,
    tipo?: TipoSolicitudPago,
    estado?: SolicitudPagoEstado,
    fechaInicio?: string,
    fechaFin?: string,
    pageIndex = 0,
    pageSize = 25
  ): Observable<PageInfo<SolicitudPago>> {
    // Handle reference ID - only set if it's not empty or whitespace
    const refId = referenciaId && referenciaId.trim() !== '' ? referenciaId : null;
    
    // Convert solicitudPagoId to string if provided, otherwise null
    const idStr = solicitudPagoId ? solicitudPagoId.toString() : null;

    // Pass pageIndex and pageSize directly as parameters
    return this.genericService.onCustomQuery(
      this.solicitudPagoConFiltrosQuery,
      {
        solicitudPagoId: idStr,  // New parameter for direct ID lookup
        referenciaId: refId,
        tipo: tipo || null,
        estado: estado || null,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        page: pageIndex,
        size: pageSize,
      }
    );
  }
} 