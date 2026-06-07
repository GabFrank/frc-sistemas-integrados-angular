import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Equipo } from '../models/equipo.model';
import { saveEquipoMutation } from './graphql-query';

export interface Response {
  data: Equipo;
}

@Injectable({
  providedIn: 'root',
})
export class SaveEquipoGQL extends Mutation<Response> {
  override document = saveEquipoMutation;
}
