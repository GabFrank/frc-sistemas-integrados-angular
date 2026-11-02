import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { reasignarLoteMutation } from './graphql-query';
import { AjusteStockLoteResultado } from '../lote.model';

@Injectable({
  providedIn: 'root'
})
export class ReasignarLoteGQL extends Mutation<{ data: AjusteStockLoteResultado }> {
  document = reasignarLoteMutation;
}
