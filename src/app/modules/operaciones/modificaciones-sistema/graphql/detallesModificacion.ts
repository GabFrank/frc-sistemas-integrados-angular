import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { detallesModificacionQuery } from './query.graphql';
import { ModificacionDetalle } from '../modificaciones.models';

export interface DetallesModificacionResponse {
  data: ModificacionDetalle[];
}

@Injectable({
  providedIn: 'root',
})
export class DetallesModificacionGQL extends Query<DetallesModificacionResponse> {
  document = detallesModificacionQuery;
}

