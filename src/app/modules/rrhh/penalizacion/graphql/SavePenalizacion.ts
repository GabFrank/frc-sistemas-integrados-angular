import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Penalizacion } from '../penalizacion.model';
import { savePenalizacionMutation } from './graphql-query';

export interface Response {
  data: Penalizacion;
}

@Injectable({ providedIn: 'root' })
export class SavePenalizacionGQL extends Mutation<Response> {
  document = savePenalizacionMutation;
}
