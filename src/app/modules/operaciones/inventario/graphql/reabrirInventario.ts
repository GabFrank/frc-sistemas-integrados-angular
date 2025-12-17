import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { reabrirInventarioQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class ReabrirInventarioGQL extends Mutation<boolean> {
  document = reabrirInventarioQuery;
}

