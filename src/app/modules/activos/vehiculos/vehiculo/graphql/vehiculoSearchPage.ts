import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Vehiculo } from '../models/vehiculo.model';
import { vehiculosSearchPageQuery } from './graphql-query';
import { PageInfo } from '../../../../../app.component';

export interface Response {
  data: PageInfo<Vehiculo>;
}

@Injectable({
  providedIn: 'root',
})
export class VehiculoSearchPageGQL extends Query<Response> {
  override document = vehiculosSearchPageQuery;
}

