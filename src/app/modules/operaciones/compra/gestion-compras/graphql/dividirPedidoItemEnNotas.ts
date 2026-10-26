import { Injectable } from '@angular/core';
import { Mutation } from 'apollo-angular';
import { dividirPedidoItemEnNotasMutation } from './graphql-query';
import { NotaRecepcionItem } from '../nota-recepcion-item.model';

@Injectable({
  providedIn: 'root'
})
export class DividirPedidoItemEnNotasGQL extends Mutation<{ data: NotaRecepcionItem[] }> {
  document = dividirPedidoItemEnNotasMutation;
}
