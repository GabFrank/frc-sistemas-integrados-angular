import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { MainService } from '../../../../main.service';
import { PagoDetalle, PagoDetalleInput } from './pago-detalle.model';
import { GetPagoDetalle } from './graphql/getPagoDetalle';
import { SavePagoDetalle } from './graphql/savePagoDetalle';
import { PagoDetallesPorPagoIdGQL } from './graphql/pagoDetallesPorPagoId';
import { DeletePagoDetalle } from './graphql/deletePagoDetalle';
import { UpdatePagoDetalleCajaySucursal } from './graphql/updatePagoDetalleCajaySucursal';
import { map } from 'rxjs/operators';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
@Injectable({
  providedIn: 'root'
})
export class PagoDetalleService {
  constructor(
    private genericService: GenericCrudService,
    private mainService: MainService,
    private getPagoDetalleQuery: GetPagoDetalle,
    private savePagoDetalleMutation: SavePagoDetalle,
    private pagoDetallesPorPagoIdQuery: PagoDetallesPorPagoIdGQL,
    private deletePagoDetalleMutation: DeletePagoDetalle,
    private updatePagoDetalleCajaySucursalMutation: UpdatePagoDetalleCajaySucursal
  ) {}

  /**
   * Obtiene un detalle de pago por su ID
   * @param id ID del detalle de pago
   * @returns Observable con el detalle de pago
   */
  onGetPagoDetalle(id: number): Observable<PagoDetalle> {
    return this.genericService.onGetById(this.getPagoDetalleQuery, id);
  }

  /**
   * Obtiene todos los detalles de pago por ID de pago
   * @param pagoId ID del pago
   * @returns Observable con la lista de detalles de pago
   */
  getPagoDetallesPorPagoId(pagoId: number): Observable<PagoDetalle[]> {
    return this.genericService.onCustomQuery(
      this.pagoDetallesPorPagoIdQuery,
      { pagoId: pagoId }
    );
  }

  /**
   * Elimina un detalle de pago por su ID
   * @param id ID del detalle de pago a eliminar
   * @returns Observable que indica si la operación fue exitosa
   */
  deletePagoDetalle(id: number): Observable<boolean> {
    return this.genericService.onDelete(
      this.deletePagoDetalleMutation,
      id,
      'Detalle de Pago',
      null,
      false
    );
  }

  /**
   * Guarda o actualiza un detalle de pago
   * @param entity Datos del detalle de pago a guardar
   * @returns Observable con el detalle de pago guardado
   */
  onSavePagoDetalle(entity: PagoDetalleInput): Observable<PagoDetalle> {
    return this.genericService.onSave(this.savePagoDetalleMutation, entity);
  }

  /**
   * Guarda un nuevo detalle de pago
   * @param entity Datos del detalle de pago a guardar
   * @returns Observable con el detalle de pago guardado
   */
  save(entity: PagoDetalleInput): Observable<PagoDetalle> {
    return this.onSavePagoDetalle(entity);
  }

  /**
   * Actualiza un detalle de pago existente
   * @param entity Datos del detalle de pago a actualizar
   * @returns Observable con el detalle de pago actualizado
   */
  update(entity: PagoDetalleInput): Observable<PagoDetalle> {
    return this.onSavePagoDetalle(entity);
  }

  /**
   * Crea un nuevo detalle de pago
   * @param pagoId ID del pago asociado
   * @param formaPagoId ID de la forma de pago
   * @param monedaId ID de la moneda
   * @param total Monto total del pago
   * @param sucursalId ID de la sucursal
   * @param cajaId ID de la caja (opcional)
   * @param fechaProgramado Fecha programada (opcional)
   * @returns Observable con el detalle de pago creado
   */
  onCreatePagoDetalle(
    pagoId: number,
    formaPagoId: number,
    monedaId: number,
    total: number,
    sucursalId: number,
    cajaId?: number,
    fechaProgramado?: Date
  ): Observable<PagoDetalle> {
    const input = new PagoDetalleInput();
    input.pagoId = pagoId;
    input.formaPagoId = formaPagoId;
    input.monedaId = monedaId;
    input.total = total;
    input.sucursalId = sucursalId;
    input.cajaId = cajaId;
    input.fechaProgramado = dateToString(fechaProgramado);
    input.activo = true;
    input.creadoEn = dateToString(new Date());

    return this.onSavePagoDetalle(input);
  }

  /**
   * Actualiza la sucursal y caja de un detalle de pago
   * @param pagoDetalleId ID del detalle de pago a actualizar
   * @param sucursalId ID de la nueva sucursal
   * @param cajaId ID de la nueva caja (opcional)
   * @returns Observable con el detalle de pago actualizado
   */
  onUpdatePagoDetalleCajaySucursal(
    pagoDetalleId: number,
    sucursalId: number,
    cajaId?: number
  ): Observable<PagoDetalle> {
    return this.genericService.onCustomMutation(
      this.updatePagoDetalleCajaySucursalMutation,
      {
        pagoDetalleId,
        sucursalId,
        cajaId
      }
    );
  }
} 