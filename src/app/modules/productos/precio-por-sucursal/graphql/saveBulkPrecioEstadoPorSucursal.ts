import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { saveBulkPromocionPorSucursalQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class saveBulkPromocionPorSucursalGQL extends Mutation {
  document = saveBulkPromocionPorSucursalQuery;
} 