import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { TabService } from '../../../../layouts/tab/tab.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { GenericListService } from '../../../../shared/components/generic-list/generic-list.service';
import { EditPedidoComponent } from '../edit-pedido/edit-pedido.component';
import { deletePedidoQuery } from '../graphql/graphql-query';
import { ListPedidoComponent } from '../list-pedido/list-pedido.component';
import { pedidoItemQuery, deletePedidoItemQuery, pedidoItensSearch, savePedidoItem } from './graphql/graphql-query';

@Injectable({
  providedIn: 'root'
})
export class PedidoItemService {

}
