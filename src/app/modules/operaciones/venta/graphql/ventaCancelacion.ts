import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { ventaCancelacionQuery } from './graphql-query';

class Response {
  data: { id: number; cancelacion: { id: number; creadoEn: Date; usuario: { id: number; nickname: string } } };
}

@Injectable({
  providedIn: 'root',
})
export class VentaCancelacionGQL extends Query<Response> {
  document = ventaCancelacionQuery;
}
