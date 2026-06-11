import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { TipoVehiculo } from '../models/tipo-vehiculo.model';
import { tipoVehiculoSearchPageQuery } from './aux-graphql-query';
import { PageInfo } from '../../../../../app.component';

export interface Response {
  data: PageInfo<TipoVehiculo>;
}

@Injectable({
  providedIn: 'root',
})
export class TipoVehiculoSearchPageGQL extends Query<Response> {
  override document = tipoVehiculoSearchPageQuery;
}
