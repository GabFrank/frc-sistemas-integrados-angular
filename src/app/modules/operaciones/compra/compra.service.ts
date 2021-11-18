import { Injectable, Type } from '@angular/core';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { TabService } from '../../../layouts/tab/tab.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { Apollo } from 'apollo-angular';
import { compraQuery, deleteCompraQuery, comprasSearch, saveCompra } from './graphql/compra/graphql-query';
import { EditCompraComponent } from './edit-compra/edit-compra.component';
import { ListCompraComponent } from './list-compra/list-compra.component';

@Injectable({
  providedIn: 'root'
})
export class CompraService {

}
