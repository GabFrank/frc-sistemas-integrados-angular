import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Actualizacion } from '../actualizacion.model';
import { ultimaActualizacion } from './graphql-query';

export interface Response {
  data: Actualizacion;
}

@Injectable({
  providedIn: 'root',
})
export class ultimaActualizacionGQL extends Query<Response> {
  document = ultimaActualizacion;
}
