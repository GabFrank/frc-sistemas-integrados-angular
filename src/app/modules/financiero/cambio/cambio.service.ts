import { CambioInput } from './cambio-input.model';
import { Observable } from 'rxjs';
import { GenericCrudService } from './../../../generics/generic-crud.service';
import { SaveCambioGQL } from './graphql/saveCambio';
import { Injectable } from '@angular/core';
import { CambiosGetAllByDateGQL } from './graphql/cambiosGetByDate';
import { Cambio } from './cambio.model';
import { UltimoCambioPorMonedaIdGQL } from './graphql/ultimoCambioPorMonedaId';

@Injectable({
  providedIn: 'root'
})
export class CambioService {

  constructor(
    private cambiosByDate: CambiosGetAllByDateGQL,
    private saveCambio: SaveCambioGQL,
    private genericService: GenericCrudService,
    private ultimoCambioPorMonedaIdGQL: UltimoCambioPorMonedaIdGQL
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
}
