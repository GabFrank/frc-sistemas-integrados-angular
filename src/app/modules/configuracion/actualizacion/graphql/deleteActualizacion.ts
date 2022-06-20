import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteActualizacionQuery, saveActualizacion } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteActualizacionGQL extends Mutation<boolean> {
  document = deleteActualizacionQuery;
}
