import { Injectable } from '@angular/core';
import { AllTiposPreciosGQL } from './graphql/allTiposPrecios';

@Injectable({
  providedIn: 'root'
})
export class TipoPrecioService {

  constructor(
    private allTipoPrecios: AllTiposPreciosGQL
  ) { }

  onGetAllTipoPrecios(){
    return this.allTipoPrecios.fetch(null, {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all'
    })
  }
}
