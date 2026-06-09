import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { EnteArchivo } from '../models/ente-archivo.model';
import { enteArchivosByEnteQuery } from './graphql-query';

export interface Response {
  data: EnteArchivo[];
}

@Injectable({ providedIn: 'root' })
export class EnteArchivosByEnteGQL extends Query<Response> {
  override document = enteArchivosByEnteQuery;
}
