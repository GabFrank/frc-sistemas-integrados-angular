import { Injectable } from '@angular/core';
import { PdvCategoriaFullInfoGQL } from './graphql/getCategoriaFullInfo';

@Injectable({
  providedIn: 'root'
})
export class PdvCategoriaService {

  constructor(
    private getCategorias: PdvCategoriaFullInfoGQL
  ) { }

  onGetCategorias(){
    return this.getCategorias.fetch(null, {fetchPolicy: 'no-cache',errorPolicy: 'all'})
  }
}
