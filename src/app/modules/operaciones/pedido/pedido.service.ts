import { Injectable, Type } from '@angular/core';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { TabService } from '../../../layouts/tab/tab.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { Apollo } from 'apollo-angular';
import { deletePedidoQuery, pedidoQuery, pedidosSearch, savePedido } from './graphql/graphql-query';
import { ListPedidoComponent } from './list-pedido/list-pedido.component';
import { EditPedidoComponent } from './edit-pedido/edit-pedido.component';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

}
