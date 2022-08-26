import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { Venta } from '../venta.model';
import { deleteVentaQuery } from './graphql-query';

class Response {
  data: Venta
}

@Injectable({
  providedIn: 'root',
})
export class DeleteVentaGQL extends Mutation<boolean> {
  document = deleteVentaQuery;
}
