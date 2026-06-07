import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Equipo } from '../models/equipo.model';
import { equipoByIdQuery } from './graphql-query';

export interface Response {
  data: Equipo;
}

@Injectable({
  providedIn: 'root',
})
export class EquipoByIdGQL extends Query<Response> {
  override document = equipoByIdQuery;
}
