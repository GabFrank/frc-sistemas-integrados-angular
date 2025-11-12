import { Injectable } from '@angular/core';
import { PuntoDeVentaByIdGQL } from './graphql/puntoDeVentaById';
import { PuntoDeVentasGQL } from './graphql/puntoDeVentasQuery';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Observable } from 'rxjs';
import { PuntoDeVenta } from './punto-de-venta.model';

@Injectable({
  providedIn: 'root'
})
export class PuntoDeVentaService {

constructor(
  private puntoDeVentaById: PuntoDeVentaByIdGQL,
  private getAllPuntoDeVentas: PuntoDeVentasGQL,
  private genericService: GenericCrudService
) { }

  onGetPuntoDeVentaById(id: number, servidor: boolean = true): Observable<PuntoDeVenta> {
    return this.genericService.onGetById(this.puntoDeVentaById, id, null, null, servidor);
  }

  onGetAllPuntoDeVentas(servidor: boolean = true): Observable<PuntoDeVenta[]> {
    return this.genericService.onGetAll(this.getAllPuntoDeVentas, null, null, servidor);
  }
}
