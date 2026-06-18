import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { EnteVinculacion } from '../models/ente-vinculacion.model';
import { enteVinculacionesBySucursalQuery } from './graphql-query';

export interface Response {
  data: EnteVinculacion[];
}

@Injectable({ providedIn: 'root' })
export class EnteVinculacionesBySucursalGQL extends Query<Response> {
  override document = enteVinculacionesBySucursalQuery;
}
