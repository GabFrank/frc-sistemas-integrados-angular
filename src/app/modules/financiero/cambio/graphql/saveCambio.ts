import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Cambio } from '../cambio.model';
import { saveCambio } from './graphql-query';

export interface Response {
  cambio: Cambio;
}

@Injectable({
  providedIn: 'root',
})
export class SaveCambioGQL extends Mutation<Response> {
  document = saveCambio;
}
