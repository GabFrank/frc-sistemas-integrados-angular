import { CambioInput } from './cambio-input.model';
import { Observable } from 'rxjs';
import { GenericCrudService, TIMEOUT_CONSULTA_DE_FONDO_MS } from './../../../generics/generic-crud.service';
import { SaveCambioGQL } from './graphql/saveCambio';
import { Injectable } from '@angular/core';
import { CambiosGetAllByDateGQL } from './graphql/cambiosGetByDate';
import { Cambio } from './cambio.model';
import { UltimoCambioPorMonedaIdGQL } from './graphql/ultimoCambioPorMonedaId';
import { ActualizarCotizacionesMercadoGQL } from './graphql/actualizarCotizacionesMercado';

@Injectable({
  providedIn: 'root'
})
export class CambioService {

  constructor(
    private cambiosByDate: CambiosGetAllByDateGQL,
    private saveCambio: SaveCambioGQL,
    private genericService: GenericCrudService,
    private ultimoCambioPorMonedaIdGQL: UltimoCambioPorMonedaIdGQL,
    private actualizarCotizacionesMercadoGQL: ActualizarCotizacionesMercadoGQL
  ) { }

  getCambiosByDate(inicial, fin): Observable<Cambio[]>{
    return this.genericService.onGetByFecha(this.cambiosByDate, inicial, fin)
  }

  onSaveCambio(cambio: CambioInput): Observable<Cambio>{
    return this.genericService.onSave(this.saveCambio, cambio)
  }

  getUltimoCambioPorMonedaId(monedaId: number): Observable<Cambio> {
    return this.genericService.onCustomQuery(this.ultimoCambioPorMonedaIdGQL, {id: monedaId}, true);
  }

  /**
   * Igual que {@link getUltimoCambioPorMonedaId}, para consultas de fondo (el poll del header): no
   * abre el spinner global, corta a los 20 s sin avisar, y propaga el error de red para que el que
   * llama se entere. Un poll de fondo no puede tapar la pantalla del cajero.
   */
  getUltimoCambioPorMonedaIdEnSegundoPlano(monedaId: number): Observable<Cambio> {
    return this.genericService.onCustomQuery(
      this.ultimoCambioPorMonedaIdGQL,
      { id: monedaId },
      true,
      { networkError: { propagate: true } },
      true,
      { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true }
    );
  }

  onActualizarCotizacionesMercado(): Observable<boolean> {
    return this.genericService.onCustomMutation(this.actualizarCotizacionesMercadoGQL, {});
  }
}
