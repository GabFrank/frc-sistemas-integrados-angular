import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { modificacionRegistroQuery } from './query.graphql';
import { ModificacionRegistro } from '../modificaciones.models';

export interface ModificacionRegistroResponse {
  data: ModificacionRegistro;
}

@Injectable({
  providedIn: 'root',
})
export class ModificacionRegistroGQL extends Query<ModificacionRegistroResponse> {
  document = modificacionRegistroQuery;
}

