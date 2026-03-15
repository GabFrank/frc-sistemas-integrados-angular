import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { PageInfo } from '../../../../app.component';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { tipoVehiculoSearchPageQuery } from './aux-graphql-query';

export interface Response {
  data: PageInfo<TipoVehiculo>;
}

@Injectable({
  providedIn: 'root',
})
export class TipoVehiculoSearchPageGQL extends Query<Response> {
  override document = tipoVehiculoSearchPageQuery;
}
