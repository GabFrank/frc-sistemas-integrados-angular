import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ajustarStockLoteMutation } from './graphql-query';
import { AjusteStockLoteResultado } from '../lote.model';

export interface AjustarStockLoteResponse {
  data: AjusteStockLoteResultado;
}

@Injectable({
  providedIn: 'root'
})
export class AjustarStockLoteGQL extends Mutation<AjustarStockLoteResponse> {
  document = ajustarStockLoteMutation;
}
