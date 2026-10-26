import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { descargarImagenSugeridaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DescargarImagenSugeridaGQL extends Query<any> {
  document = descargarImagenSugeridaQuery;
}
