import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Venta } from '../venta.model';
import { deleteCobroDetalleQuery } from './graphql-query';

@Injectable({
  providedIn: 'root',
})
export class DeleteCobroDetalleGQL extends Mutation<boolean> {
  document = deleteCobroDetalleQuery;
}
