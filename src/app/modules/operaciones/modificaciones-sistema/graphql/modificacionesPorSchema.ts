import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { modificacionesPorSchemaQuery } from './query.graphql';
import { ModificacionRegistro } from '../modificaciones.models';

export interface ModificacionRegistroPageResponse {
  content: ModificacionRegistro[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface ModificacionesPorSchemaResponse {
  data: ModificacionRegistroPageResponse;
}

@Injectable({
  providedIn: 'root',
})
export class ModificacionesPorSchemaGQL extends Query<ModificacionesPorSchemaResponse> {
  document = modificacionesPorSchemaQuery;
}

