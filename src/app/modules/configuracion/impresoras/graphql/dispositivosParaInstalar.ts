import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { DispositivoDetectado } from '../impresora.model';
import { dispositivosParaInstalarQuery } from './graphql-query';

export interface Response {
  data: DispositivoDetectado[];
}

@Injectable({
  providedIn: 'root',
})
export class DispositivosParaInstalarGQL extends Query<Response> {
  document = dispositivosParaInstalarQuery;
}
