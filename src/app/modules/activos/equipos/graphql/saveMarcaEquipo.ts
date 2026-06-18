import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { MarcaEquipo } from '../models/marca-equipo.model';
import { saveMarcaEquipoMutation } from './graphql-query';

export interface Response {
  data: MarcaEquipo;
}

@Injectable({
  providedIn: 'root',
})
export class SaveMarcaEquipoGQL extends Mutation<Response> {
  override document = saveMarcaEquipoMutation;
}
