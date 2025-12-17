import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { cancelarInventarioQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class CancelarInventarioGQL extends Mutation<boolean> {
  document = cancelarInventarioQuery;
}

