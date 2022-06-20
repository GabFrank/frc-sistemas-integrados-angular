import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Actualizacion } from '../actualizacion.model';
import { actualizacionQuery } from './graphql-query';

export interface Response {
  data: Actualizacion;
}

@Injectable({
  providedIn: 'root',
})
export class ActualizacionByIdGQL extends Query<Response> {
  document = actualizacionQuery;
}
