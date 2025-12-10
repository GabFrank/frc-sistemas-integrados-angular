import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { modificacionesPorTipoEntidadAndSchemaQuery } from './query.graphql';
import { ModificacionRegistro } from '../modificaciones.models';

export interface ModificacionRegistroPageResponse {
  content: ModificacionRegistro[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface ModificacionesPorTipoEntidadAndSchemaResponse {
  data: ModificacionRegistroPageResponse;
}

@Injectable({
  providedIn: 'root',
})
export class ModificacionesPorTipoEntidadAndSchemaGQL extends Query<ModificacionesPorTipoEntidadAndSchemaResponse> {
  document = modificacionesPorTipoEntidadAndSchemaQuery;
}

