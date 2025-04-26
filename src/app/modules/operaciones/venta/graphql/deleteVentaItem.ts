import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { deleteVentaItemQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteVentaItemGQL extends Mutation<boolean> {
  document = deleteVentaItemQuery;
}
