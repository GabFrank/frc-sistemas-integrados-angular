import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { savePromocionPorSucursalQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class savePromocionPorSucursalGQL extends Mutation {
  document = savePromocionPorSucursalQuery;
} 