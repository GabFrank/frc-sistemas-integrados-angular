import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { Vuelto } from '../vuelto.model';
import { saveVueltoQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class SaveVueltoGQL extends Mutation {
  document = saveVueltoQuery;
}
