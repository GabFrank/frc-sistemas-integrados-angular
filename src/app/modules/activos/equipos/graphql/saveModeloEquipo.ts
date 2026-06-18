import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { ModeloEquipo } from '../models/modelo-equipo.model';
import { saveModeloEquipoMutation } from './graphql-query';

export interface Response {
  data: ModeloEquipo;
}

@Injectable({
  providedIn: 'root',
})
export class SaveModeloEquipoGQL extends Mutation<Response> {
  override document = saveModeloEquipoMutation;
}
