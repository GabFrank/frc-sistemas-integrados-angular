import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PagoDetalleCuota, PagoDetalleCuotaInput } from './pago-detalle-cuota.model';
import { GetPagoDetalleCuotaGQL } from './graphql/getPagoDetalleCuota';
import { GetPagoDetalleCuotasGQL } from './graphql/getPagoDetalleCuotas';
import { GetPagoDetalleCuotasPorPagoDetalleIdGQL } from './graphql/getPagoDetalleCuotasPorPagoDetalleId';
import { GetPagoDetalleCuotasSearchGQL } from './graphql/getPagoDetalleCuotasSearch';
import { GetCountPagoDetalleCuotaGQL } from './graphql/getCountPagoDetalleCuota';
import { SavePagoDetalleCuotaGQL } from './graphql/savePagoDetalleCuota';
import { DeletePagoDetalleCuotaGQL } from './graphql/deletePagoDetalleCuota';

@Injectable({
  providedIn: 'root'
})
export class PagoDetalleCuotaService {

  constructor(
    private genericService: GenericCrudService,
    private getPagoDetalleCuotaGQL: GetPagoDetalleCuotaGQL,
    private getPagoDetalleCuotasGQL: GetPagoDetalleCuotasGQL,
    private getPagoDetalleCuotasPorPagoDetalleIdGQL: GetPagoDetalleCuotasPorPagoDetalleIdGQL,
    private getPagoDetalleCuotasSearchGQL: GetPagoDetalleCuotasSearchGQL,
    private getCountPagoDetalleCuotaGQL: GetCountPagoDetalleCuotaGQL,
    private savePagoDetalleCuotaGQL: SavePagoDetalleCuotaGQL,
    private deletePagoDetalleCuotaGQL: DeletePagoDetalleCuotaGQL
  ) { }

  /**
   * Obtiene una cuota de detalle de pago por su ID
   * @param id ID de la cuota
   * @returns Observable de PagoDetalleCuota
   */
  onGetPagoDetalleCuota(id: number): Observable<PagoDetalleCuota> {
    return this.genericService.onGetById(this.getPagoDetalleCuotaGQL, id);
  }

  /**
   * Obtiene todas las cuotas de detalle de pago con paginación
   * @param page Número de página
   * @param size Tamaño de página
   * @returns Observable de lista de cuotas
   */
  onGetPagoDetalleCuotas(page: number = 0, size: number = 10): Observable<PagoDetalleCuota[]> {
    return this.genericService.onGetAll(this.getPagoDetalleCuotasGQL, page, size);
  }

  /**
   * Obtiene todas las cuotas asociadas a un detalle de pago específico
   * @param pagoDetalleId ID del detalle de pago
   * @returns Observable de lista de cuotas
   */
  onGetPagoDetalleCuotasPorPagoDetalleId(pagoDetalleId: number): Observable<PagoDetalleCuota[]> {
    return this.genericService.onCustomQuery(this.getPagoDetalleCuotasPorPagoDetalleIdGQL, { pagoDetalleId });
  }

  /**
   * Busca cuotas de detalle de pago por texto
   * @param texto Texto para búsqueda
   * @returns Observable de lista de cuotas
   */
  onSearchPagoDetalleCuotas(texto: string): Observable<PagoDetalleCuota[]> {
    return this.genericService.onCustomQuery(this.getPagoDetalleCuotasSearchGQL, { texto });
  }

  /**
   * Obtiene el conteo total de cuotas de detalle de pago
   * @returns Observable con el número total de cuotas
   */
  onCountPagoDetalleCuotas(): Observable<number> {
    return this.genericService.onCustomQuery(this.getCountPagoDetalleCuotaGQL, {});
  }

  /**
   * Guarda o actualiza una cuota de detalle de pago
   * @param entity Datos de la cuota a guardar
   * @returns Observable de la cuota guardada
   */
  onSavePagoDetalleCuota(entity: PagoDetalleCuotaInput): Observable<PagoDetalleCuota> {
    return this.genericService.onSave(this.savePagoDetalleCuotaGQL, entity);
  }

  /**
   * Elimina una cuota de detalle de pago por su ID
   * @param id ID de la cuota a eliminar
   * @returns Observable booleano indicando si se eliminó correctamente
   */
  onDeletePagoDetalleCuota(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deletePagoDetalleCuotaGQL, id, 'Cuota');
  }
} 