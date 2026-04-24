import { Injectable } from '@angular/core';
import { AllTiposPreciosGQL } from './graphql/allTiposPrecios';
import { GenericCrudService } from '../../../generics/generic-crud.service';

@Injectable({
  providedIn: 'root'
})
export class TipoPrecioService {

  constructor(
    private allTipoPrecios: AllTiposPreciosGQL,
    private genericService: GenericCrudService
  ) { }

  onGetAllTipoPrecios(servidor: boolean = true){
    return this.genericService.onCustomQuery(this.allTipoPrecios, null, servidor);
  }
}
