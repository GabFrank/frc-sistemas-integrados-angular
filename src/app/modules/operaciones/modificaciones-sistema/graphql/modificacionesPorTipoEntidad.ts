import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { modificacionesPorTipoEntidadQuery } from './query.graphql';
import { ModificacionRegistro } from '../modificaciones.models';

export interface ModificacionRegistroPageResponse {
  content: ModificacionRegistro[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface ModificacionesPorTipoEntidadResponse {
  data: ModificacionRegistroPageResponse;
}

@Injectable({
  providedIn: 'root',
})
export class ModificacionesPorTipoEntidadGQL extends Query<ModificacionesPorTipoEntidadResponse> {
  document = modificacionesPorTipoEntidadQuery;
}

