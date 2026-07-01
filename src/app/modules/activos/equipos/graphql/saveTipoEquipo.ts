import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { TipoEquipo } from '../models/tipo-equipo.model';
import { saveTipoEquipoMutation } from './graphql-query';

export interface Response {
  data: TipoEquipo;
}

@Injectable({
  providedIn: 'root',
})
export class SaveTipoEquipoGQL extends Mutation<Response> {
  override document = saveTipoEquipoMutation;
}
