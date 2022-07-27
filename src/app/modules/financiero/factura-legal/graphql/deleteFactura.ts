import { Injectable } from '@angular/core';
import { Mutation, Query } from 'apollo-angular';
import { deleteFacturaLegalQuery, facturaLegalQuery, saveFacturaLegal } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteFacturaLegalGQL extends Mutation<boolean> {
  document = deleteFacturaLegalQuery;
}
