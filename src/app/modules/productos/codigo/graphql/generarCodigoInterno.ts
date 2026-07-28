import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { generarCodigoInternoQuery } from './graphql-query';

interface Response {
  data: string;
}

@Injectable({
  providedIn: 'root',
})
export class GenerarCodigoInternoGQL extends Query<Response> {
  document = generarCodigoInternoQuery;
}
