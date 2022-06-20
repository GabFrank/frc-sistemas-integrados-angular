import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Actualizacion } from '../actualizacion.model';
import { saveActualizacion } from './graphql-query';

export interface Response {
  data: Actualizacion;
}

@Injectable({
  providedIn: 'root',
})
export class SaveActualizacionGQL extends Mutation<Response> {
  document = saveActualizacion;
}
