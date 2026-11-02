import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { modificacionesPorSchemasQuery } from './query.graphql';
import { ModificacionesPorSchemaResponse } from './modificacionesPorSchema';

@Injectable({
  providedIn: 'root',
})
export class ModificacionesPorSchemasGQL extends Query<ModificacionesPorSchemaResponse> {
  document = modificacionesPorSchemasQuery;
}
