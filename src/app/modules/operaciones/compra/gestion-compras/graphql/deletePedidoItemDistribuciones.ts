import { Injectable } from '@angular/core';
import { Apollo, Mutation } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { deletePedidoItemDistribucionesByIdsMutation } from './graphql-query';

interface Response {
  data: boolean;
}

interface Variables {
  ids: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DeletePedidoItemDistribucionesGQL extends Mutation<Response, Variables> {
  document = deletePedidoItemDistribucionesByIdsMutation;
} 