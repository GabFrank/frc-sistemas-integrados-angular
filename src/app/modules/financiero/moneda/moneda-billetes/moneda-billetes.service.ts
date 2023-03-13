import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { monedaBilletePorMonedaId } from './graphql/graphql-query';
import { MonedaBilletesPorMonedaIdGQL } from './graphql/monedaBilletesPorMonedaId';

@Injectable({
  providedIn: 'root'
})
export class MonedaBilletesService {

  constructor(
    private genericService: GenericCrudService,
    private monedaBilletesPorMonedaId: MonedaBilletesPorMonedaIdGQL
  ) { }

  // onGetAll(): Observable<any> {
  //   return this.genericService.onGetAll(this.getAllMonedaBilletess);
  // }

  onGetByMonedaId(id): Observable<any>{
    return this.genericService.onGetById(this.monedaBilletesPorMonedaId, id);
  }
}
