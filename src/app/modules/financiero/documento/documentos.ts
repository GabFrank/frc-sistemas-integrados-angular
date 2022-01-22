import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { Documento } from './documento.model';
import { documentosQuery } from './graphql-query';

export interface Response {
  data: Documento[];
}

@Injectable({
  providedIn: 'root',
})
export class AllDocumentosGQL extends Query<Response> {
  document = documentosQuery;
}
