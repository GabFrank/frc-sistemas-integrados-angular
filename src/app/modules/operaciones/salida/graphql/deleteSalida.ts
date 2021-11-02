import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Salida } from '../salida.model';
import { deleteSalidaQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteSalidaGQL extends Mutation<boolean> {
  document = deleteSalidaQuery;
}
