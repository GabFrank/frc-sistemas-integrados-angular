import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { MainService } from '../../../main.service';
import { PromocionPorSucursal, PromocionPorSucursalInput } from './promocion-por-sucursal';
import { UntilDestroy } from '@ngneat/until-destroy';
import { savePromocionPorSucursalGQL } from './graphql/savePrecioEstadoPorSucursal';
import { getPromocionesPorPresentacionGQL } from './graphql/getPrecioEstadosPorPresentacion';
import { saveBulkPromocionPorSucursalGQL } from './graphql/saveBulkPrecioEstadoPorSucursal';
import { getPromocionesPorPrecioIdGQL } from './graphql/getPromocionesPorPrecioId';
import { deleteBulkPromocionPorSucursalGQL } from './graphql/deleteBulkPromocionPorSucursal';
import { verificarPromocionesGQL } from './graphql/verificarPromociones';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class PromocionPorSucursalService {

  constructor(
    private mainService: MainService,
    private savePromocion: savePromocionPorSucursalGQL,
    private getPromocionesPorPresentacion: getPromocionesPorPresentacionGQL,
    private saveBulkPromocion: saveBulkPromocionPorSucursalGQL,
    private getPromocionesPorPrecioId: getPromocionesPorPrecioIdGQL,
    private deleteBulkPromocion: deleteBulkPromocionPorSucursalGQL,
    private verificarPromociones: verificarPromocionesGQL,
  ) {}

  onGetPromocionesPorPresentacion(presentacionId: number): Observable<PromocionPorSucursal[]> {
    return this.getPromocionesPorPresentacion.watch(
      { presentacionId }, 
      { fetchPolicy: 'no-cache' }
    )
    .valueChanges.pipe(map((res: any) => 
      res.data.promocionesPorPresentacion));
  }
  
  onGetPromocionesPorPrecioId(precioId: number): Observable<PromocionPorSucursal[]> {
    return this.getPromocionesPorPrecioId.watch(
      { precioId }, 
      { fetchPolicy: 'no-cache' }
    )
    .valueChanges.pipe(map((res: any) =>
      res.data.promocionesPorPrecioId));
  }

  onSave(input: PromocionPorSucursalInput): Observable<PromocionPorSucursal> {
    input.usuarioId = this.mainService.usuarioActual.id;
    return this.savePromocion.mutate(
      { promocion: input }, 
      { fetchPolicy: 'no-cache' }
    )
    .pipe(map((res: any) => res.data.savePromocionPorSucursal));
  }

  onSaveBulk(inputs: PromocionPorSucursalInput[]): Observable<boolean> {
    if (!Array.isArray(inputs) || inputs.length === 0) {
      return new BehaviorSubject(true);
    }
    const processedInputs = inputs.map(input => {
      const mutationInput: any = { ...input };
      mutationInput.usuarioId = String(this.mainService.usuarioActual.id);
      if (mutationInput.precioId != null) mutationInput.precioId = String(mutationInput.precioId);
      if (mutationInput.sucursalId != null) mutationInput.sucursalId = String(mutationInput.sucursalId);
      return mutationInput;
    });
    return this.saveBulkPromocion.mutate(
      { promociones: processedInputs }, 
      { fetchPolicy: 'no-cache' }
    )
    .pipe(map((res: any) => 
      res.data.saveBulkPromocionPorSucursal));
  }

  onDeleteBulk(ids: number[]): Observable<boolean> {
    const stringIds = ids.map(id => String(id));
    return this.deleteBulkPromocion.mutate(
      { ids: stringIds }, 
      { fetchPolicy: 'no-cache' }
    )
    .pipe(map((res: any) => 
      res.data.deleteBulkPromocionPorSucursal));
  }

  onVerificarPromociones(presentacionId: number, sucursalesIds: number[]): Observable<any> {
    return this.verificarPromociones.watch({ 
      presentacionId: String(presentacionId),
      sucursalesIds: sucursalesIds.map(id => String(id))
    }, { fetchPolicy: 'no-cache' })
    .valueChanges.pipe(map((res: any) =>
       res.data.verificarPromociones));
  }
} 