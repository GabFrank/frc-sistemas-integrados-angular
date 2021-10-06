import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Presentacion } from '../presentacion.model';
import { savePresentacion } from './graphql-query';

export interface Response {
  data: Presentacion;
}


@Injectable({
  providedIn: 'root',
})
export class savePresentacionGQL extends Mutation<Response> {
  document = savePresentacion;
}


