import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { buscarLotePorNumeroQuery } from './graphql-query';
import { ResultadoBusquedaLote } from '../lote.model';

export interface BuscarLotePorNumeroResponse {
  data: ResultadoBusquedaLote;
}

@Injectable({
  providedIn: 'root'
})
export class BuscarLotePorNumeroGQL extends Query<BuscarLotePorNumeroResponse> {
  document = buscarLotePorNumeroQuery;
}
