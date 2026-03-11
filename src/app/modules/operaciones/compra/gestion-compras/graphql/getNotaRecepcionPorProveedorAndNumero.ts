import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import { notaRecepcionPorProveedorAndNumeroQuery } from './graphql-query';

@Injectable({
  providedIn: 'root'
})
export class GetNotaRecepcionPorProveedorAndNumeroGQL extends Query<any> {
  document = notaRecepcionPorProveedorAndNumeroQuery;
}
