import { Injectable } from '@angular/core';
import { AllTiposPreciosGQL } from './graphql/allTiposPrecios';
import { ContextoConsulta, GenericCrudService, QueryError } from '../../../generics/generic-crud.service';

@Injectable({
  providedIn: 'root'
})
export class TipoPrecioService {

  constructor(
    private allTipoPrecios: AllTiposPreciosGQL,
    private genericService: GenericCrudService
  ) { }

  onGetAllTipoPrecios(servidor: boolean = true, errorConf?: QueryError, contexto?: ContextoConsulta){
    return this.genericService.onCustomQuery(this.allTipoPrecios, null, servidor, errorConf, undefined, contexto);
  }
}
