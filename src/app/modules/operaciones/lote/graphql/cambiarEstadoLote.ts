import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cambiarEstadoLoteMutation } from './graphql-query';
import { Lote } from '../lote.model';

export interface CambiarEstadoLoteResponse {
  data: Lote;
}

@Injectable({
  providedIn: 'root'
})
export class CambiarEstadoLoteGQL extends Mutation<CambiarEstadoLoteResponse> {
  document = cambiarEstadoLoteMutation;
}
