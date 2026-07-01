import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { getEnteArchivoContenidoQuery } from './graphql-query';

export interface Response {
  data: string[];
}

@Injectable({ providedIn: 'root' })
export class GetEnteArchivoContenidoGQL extends Query<Response> {
  override document = getEnteArchivoContenidoQuery;
}
