import { Injectable } from '@angular/core';
import { PuntoDeVentaByIdGQL } from './graphql/puntoDeVentaById';
import { PuntoDeVentaPorIdGQL } from './graphql/puntoDeVentaPorId';
import { PuntoDeVentasGQL } from './graphql/puntoDeVentasQuery';
import { GenericCrudService, TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../generics/generic-crud.service';
import { Observable } from 'rxjs';
import { PuntoDeVenta } from './punto-de-venta.model';

@Injectable({
  providedIn: 'root'
})
export class PuntoDeVentaService {

constructor(
  private puntoDeVentaById: PuntoDeVentaByIdGQL,
  private puntoDeVentaPorId: PuntoDeVentaPorIdGQL,
  private getAllPuntoDeVentas: PuntoDeVentasGQL,
  private genericService: GenericCrudService
) { }

  onGetPuntoDeVentaById(id: number, servidor: boolean = true): Observable<PuntoDeVenta> {
    return this.genericService.onGetById(this.puntoDeVentaById, id, null, null, servidor);
  }

  onGetAllPuntoDeVentas(servidor: boolean = true): Observable<PuntoDeVenta[]> {
    return this.genericService.onGetAll(this.getAllPuntoDeVentas, null, null, servidor);
  }

  /**
   * Valida el PDV al abrir Venta (issue #355): el POS espera el error para avisar y cerrar la pestaña.
   * Sin `propagate` un error de red no emite nada, y sin timeout corto un filial congelado tarda 300 s.
   */
  onGetPuntoDeVentaPorId(id: number, servidor: boolean = true): Observable<PuntoDeVenta> {
    return this.genericService.onCustomQuery(
      this.puntoDeVentaPorId,
      { id },
      servidor,
      { networkError: { propagate: true, show: false } },
      true,
      { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true }
    );
  }
}
