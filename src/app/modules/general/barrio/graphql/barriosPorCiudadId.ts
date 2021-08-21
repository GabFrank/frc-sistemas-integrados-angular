import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Barrio } from '../barrio.model';
import { barriosPorCiudadQuery } from './graphql-query';

export interface Response {
  data: Barrio[];
}

@Injectable({
  providedIn: 'root',
})
export class BarriosPorCiudadIdGQL extends Query<Response> {
  document = barriosPorCiudadQuery;
}
