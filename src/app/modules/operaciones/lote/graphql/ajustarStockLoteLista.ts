import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ajustarStockLoteListaMutation } from './graphql-query';
import { AjusteStockLoteResultado } from '../lote.model';

export interface AjustarStockLoteListaResponse {
  data: AjusteStockLoteResultado[];
}

@Injectable({
  providedIn: 'root'
})
export class AjustarStockLoteListaGQL extends Mutation<AjustarStockLoteListaResponse> {
  document = ajustarStockLoteListaMutation;
}
