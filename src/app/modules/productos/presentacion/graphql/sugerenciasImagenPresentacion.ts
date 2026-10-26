import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { sugerenciasImagenPresentacionQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SugerenciasImagenPresentacionGQL extends Query<any> {
  document = sugerenciasImagenPresentacionQuery;
}
