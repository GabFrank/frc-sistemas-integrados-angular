import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SolicitudPago, SolicitudPagoInput, SolicitudPagoEstado } from './solicitud-pago.model';
import { NotaRecepcion } from './nota-recepcion.model';
import { GetSolicitudesPorPedidoGQL } from './graphql/getSolicitudesPorPedido';
import { GetSolicitudPagoGQL } from './graphql/getSolicitudPago';
import { GetNotasDisponiblesParaPagoGQL } from './graphql/getNotasDisponiblesParaPago';
import { SaveSolicitudPagoGQL } from './graphql/saveSolicitudPago';
import { DeleteSolicitudPagoGQL } from './graphql/deleteSolicitudPago';
import { ActualizarEstadoSolicitudPagoGQL } from './graphql/actualizarEstadoSolicitudPago';
import { ImprimirSolicitudPagoPDFGQL } from './graphql/imprimirSolicitudPagoPDF';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

@Injectable({
  providedIn: 'root'
})
export class SolicitudPagoService {

  constructor(
    private getSolicitudesPorPedidoGQL: GetSolicitudesPorPedidoGQL,
    private getSolicitudPagoGQL: GetSolicitudPagoGQL,
    private getNotasDisponiblesParaPagoGQL: GetNotasDisponiblesParaPagoGQL,
    private saveSolicitudPagoGQL: SaveSolicitudPagoGQL,
    private deleteSolicitudPagoGQL: DeleteSolicitudPagoGQL,
    private actualizarEstadoSolicitudPagoGQL: ActualizarEstadoSolicitudPagoGQL,
    private imprimirSolicitudPagoPDFGQL: ImprimirSolicitudPagoPDFGQL,
    private genericCrudService: GenericCrudService
  ) {}

  /**
   * Obtiene todas las solicitudes de pago de un pedido específico
   * @param pedidoId ID del pedido
   * @returns Observable con lista de solicitudes de pago
   */
  onGetSolicitudesPorPedido(pedidoId: number): Observable<SolicitudPago[]> {
    return this.genericCrudService.onCustomQuery(
      this.getSolicitudesPorPedidoGQL, 
      { pedidoId }, 
      true, 
      null, 
      true
    ).pipe(
      map(result => this.processComputedProperties(result as SolicitudPago[]))
    );
  }

  /**
   * Obtiene una solicitud de pago por su ID
   * @param id ID de la solicitud de pago
   * @returns Observable con la solicitud de pago
   */
  onGetById(id: number): Observable<SolicitudPago> {
    return this.genericCrudService.onGetById<SolicitudPago>(
      this.getSolicitudPagoGQL, 
      id, 
      null, 
      null, 
      true, 
      null, 
      null, 
      null, 
      true
    ).pipe(
      map(result => this.processComputedProperty(result as SolicitudPago))
    );
  }

  /**
   * Obtiene las notas de recepción disponibles para crear solicitudes de pago
   * @param pedidoId ID del pedido
   * @returns Observable con lista de notas disponibles
   */
  onGetNotasDisponiblesParaPago(pedidoId: number): Observable<NotaRecepcion[]> {
    return this.genericCrudService.onCustomQuery(
      this.getNotasDisponiblesParaPagoGQL, 
      { pedidoId }, 
      true, 
      null, 
      true
    );
  }

  /**
   * Guarda o actualiza una solicitud de pago
   * @param solicitud Solicitud de pago a guardar
   * @returns Observable con la solicitud de pago guardada
   */
  onSave(solicitud: SolicitudPago): Observable<SolicitudPago> {
    const input = solicitud.toInput();
    return this.genericCrudService.onSave<SolicitudPago>(
      this.saveSolicitudPagoGQL, 
      input
    ).pipe(
      map(result => this.processComputedProperty(result as SolicitudPago))
    );
  }

  /**
   * Guarda una solicitud de pago usando directamente el input
   * @param input Input de la solicitud de pago
   * @returns Observable con la solicitud de pago guardada
   */
  onSaveInput(input: SolicitudPagoInput): Observable<SolicitudPago> {
    return this.genericCrudService.onSave<SolicitudPago>(
      this.saveSolicitudPagoGQL, 
      input
    ).pipe(
      map(result => this.processComputedProperty(result as SolicitudPago))
    );
  }

  /**
   * Elimina una solicitud de pago
   * Solo permite eliminación si está en estado PENDIENTE
   * @param id ID de la solicitud de pago a eliminar
   * @returns Observable con resultado booleano
   */
  onDelete(id: number): Observable<boolean> {
    return this.genericCrudService.onDelete(
      this.deleteSolicitudPagoGQL, 
      id, 
      'solicitud de pago', 
      null, 
      true
    );
  }

  /**
   * Actualiza el estado de una solicitud de pago
   * @param id ID de la solicitud de pago
   * @param estado Nuevo estado
   * @returns Observable con la solicitud de pago actualizada
   */
  onActualizarEstado(id: number, estado: SolicitudPagoEstado): Observable<SolicitudPago> {
    return this.genericCrudService.onCustomMutation(
      this.actualizarEstadoSolicitudPagoGQL, 
      { id, estado }
    ).pipe(
      map(result => this.processComputedProperty(result as SolicitudPago))
    );
  }

  /**
   * Imprime una solicitud de pago en PDF
   * @param solicitudPagoId ID de la solicitud de pago
   * @returns Observable con el PDF en base64
   */
  onImprimirSolicitudPagoPDF(solicitudPagoId: number): Observable<string> {
    return this.genericCrudService.onCustomMutation(
      this.imprimirSolicitudPagoPDFGQL, 
      { solicitudPagoId }
    );
  }

  /**
   * Procesa las propiedades computadas para un array de solicitudes
   * @param solicitudes Array de solicitudes de pago
   * @returns Array de solicitudes con propiedades computadas
   */
  private processComputedProperties(solicitudes: SolicitudPago[]): SolicitudPago[] {
    return solicitudes.map(solicitud => this.processComputedProperty(solicitud));
  }

  /**
   * Procesa las propiedades computadas para una solicitud individual
   * @param solicitud Solicitud de pago
   * @returns Solicitud con propiedades computadas
   */
  private processComputedProperty(solicitud: SolicitudPago): SolicitudPago {
    if (!solicitud) return solicitud;

    // Estado display name
    solicitud.estadoDisplayNameComputed = this.getEstadoDisplayName(solicitud.estado);
    
    // Estado chip color
    solicitud.estadoChipColorComputed = this.getEstadoChipColor(solicitud.estado);
    
    // Fechas formateadas
    solicitud.fechaSolicitudFormattedComputed = dateToString(solicitud.fechaSolicitud);
    
    solicitud.fechaPagoPropuestaFormattedComputed = dateToString(solicitud.fechaPagoPropuesta);
    
    // Monto formateado
    solicitud.montoTotalFormattedComputed = solicitud.montoTotal;
    
    // Cantidad de notas
    solicitud.cantidadNotasComputed = solicitud.notasRecepcion?.length || 0;

    return solicitud;
  }

  /**
   * Obtiene el nombre display del estado
   * @param estado Estado de la solicitud
   * @returns Nombre para mostrar
   */
  private getEstadoDisplayName(estado: SolicitudPagoEstado): string {
    switch (estado) {
      case SolicitudPagoEstado.PENDIENTE:
        return 'Pendiente';
      case SolicitudPagoEstado.PARCIAL:
        return 'Pago Parcial';
      case SolicitudPagoEstado.CONCLUIDO:
        return 'Pagada';
      case SolicitudPagoEstado.CANCELADO:
        return 'Cancelada';
      default:
        return estado;
    }
  }

  /**
   * Obtiene el color del chip según el estado
   * @param estado Estado de la solicitud
   * @returns Color del chip
   */
  private getEstadoChipColor(estado: SolicitudPagoEstado): string {
    switch (estado) {
      case SolicitudPagoEstado.PENDIENTE:
        return 'warn';
      case SolicitudPagoEstado.PARCIAL:
        return 'accent';
      case SolicitudPagoEstado.CONCLUIDO:
        return 'primary';
      case SolicitudPagoEstado.CANCELADO:
        return 'basic';
      default:
        return 'basic';
    }
  }

  /**
   * Valida si una solicitud puede ser editada
   * @param solicitud Solicitud de pago
   * @returns true si puede ser editada
   */
  canEdit(solicitud: SolicitudPago): boolean {
    return solicitud.estado === SolicitudPagoEstado.PENDIENTE;
  }

  /**
   * Valida si una solicitud puede ser eliminada
   * @param solicitud Solicitud de pago
   * @returns true si puede ser eliminada
   */
  canDelete(solicitud: SolicitudPago): boolean {
    return solicitud.estado === SolicitudPagoEstado.PENDIENTE;
  }

  /**
   * Valida si el estado de una solicitud puede ser cambiado
   * @param solicitud Solicitud de pago
   * @param nuevoEstado Nuevo estado propuesto
   * @returns true si la transición es válida
   */
  canChangeState(solicitud: SolicitudPago, nuevoEstado: SolicitudPagoEstado): boolean {
    switch (solicitud.estado) {
      case SolicitudPagoEstado.PENDIENTE:
        return [SolicitudPagoEstado.PARCIAL, SolicitudPagoEstado.CONCLUIDO, SolicitudPagoEstado.CANCELADO].includes(nuevoEstado);
      case SolicitudPagoEstado.PARCIAL:
        return [SolicitudPagoEstado.CONCLUIDO, SolicitudPagoEstado.CANCELADO].includes(nuevoEstado);
      case SolicitudPagoEstado.CONCLUIDO:
      case SolicitudPagoEstado.CANCELADO:
        return false; // Estados finales
      default:
        return false;
    }
  }
}

