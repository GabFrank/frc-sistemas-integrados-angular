import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Feriado } from '../feriado.model';
import { saveFeriadoMutation } from './graphql-query';

export interface Response {
  data: Feriado;
}

@Injectable({ providedIn: 'root' })
export class SaveFeriadoGQL extends Mutation<Response> {
  document = saveFeriadoMutation;
}
