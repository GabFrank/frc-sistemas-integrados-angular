import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { MarcaEquipo } from '../models/marca-equipo.model';
import { marcaEquipoSearchQuery } from './graphql-query';

export interface Response {
  data: MarcaEquipo[];
}

@Injectable({
  providedIn: 'root',
})
export class MarcaEquipoSearchGQL extends Query<Response> {
  override document = marcaEquipoSearchQuery;
}
