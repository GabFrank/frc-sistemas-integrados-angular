import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { buscarLotesDeProductoQuery } from './graphql-query';
import { PageInfo } from '../../../../app.component';
import { LoteDeProducto } from '../lote.model';

export interface BuscarLotesDeProductoResponse {
  data: PageInfo<LoteDeProducto>;
}

@Injectable({
  providedIn: 'root'
})
export class BuscarLotesDeProductoGQL extends Query<BuscarLotesDeProductoResponse> {
  document = buscarLotesDeProductoQuery;
}
