import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveTipoPrecio } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class saveTipoPrecioGQL extends Mutation {
  document = saveTipoPrecio;
} 