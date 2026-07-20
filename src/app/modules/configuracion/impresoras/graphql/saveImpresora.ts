import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Impresora } from '../impresora.model';
import { saveImpresora } from './graphql-query';

export interface Response {
  data: Impresora;
}

@Injectable({
  providedIn: 'root',
})
export class SaveImpresoraGQL extends Mutation<Response> {
  document = saveImpresora;
}
