import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveVenta } from './graphql-query';

class Response {
  data: string
}

@Injectable({
  providedIn: 'root',
})
export class SaveVentaPagareGQL extends Mutation<Response> {
  document = saveVenta;
}
