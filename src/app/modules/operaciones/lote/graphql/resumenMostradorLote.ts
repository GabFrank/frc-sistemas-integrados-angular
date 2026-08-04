import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { resumenMostradorLoteQuery } from './graphql-query';
import { MostradorLote } from '../lote.model';

export interface ResumenMostradorLoteResponse {
  data: MostradorLote;
}

@Injectable({
  providedIn: 'root'
})
export class ResumenMostradorLoteGQL extends Query<ResumenMostradorLoteResponse> {
  document = resumenMostradorLoteQuery;
}
