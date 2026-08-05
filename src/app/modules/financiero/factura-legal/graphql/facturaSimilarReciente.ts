import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { FacturaSimilar } from '../factura-similar.model';
import { facturaSimilarRecienteQuery } from './graphql-query';

class Response {
  data: FacturaSimilar;
}

@Injectable({
  providedIn: 'root',
})
export class FacturaSimilarRecienteGQL extends Query<Response> {
  document = facturaSimilarRecienteQuery;
}
