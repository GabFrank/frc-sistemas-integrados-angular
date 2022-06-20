import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Actualizacion } from '../actualizacion.model';
import { actualizacionesQuery } from './graphql-query';

export interface Response {
  data: Actualizacion[];
}

@Injectable({
  providedIn: 'root',
})
export class ActualizacionesGQL extends Query<Actualizacion[]> {
  document = actualizacionesQuery;
}
