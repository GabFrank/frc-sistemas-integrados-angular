import { Injectable } from '@angular/core';
import { Apollo, Mutation } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { savePedidoItemDistribucionesMutation } from './graphql-query';
import { PedidoItemDistribucion, PedidoItemDistribucionInput } from '../pedido-item-distribucion.model';

interface Response {
  data: PedidoItemDistribucion[];
}

interface Variables {
  pedidoItemId: number;
  inputs: PedidoItemDistribucionInput[];
}

@Injectable({
  providedIn: 'root'
})
export class SavePedidoItemDistribucionesGQL extends Mutation<Response, Variables> {
  document = savePedidoItemDistribucionesMutation;
} 