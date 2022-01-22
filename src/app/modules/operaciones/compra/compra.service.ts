import { Injectable, Type } from '@angular/core';
import { GenericListService } from '../../../shared/components/generic-list/generic-list.service';
import { TabService } from '../../../layouts/tab/tab.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { Apollo } from 'apollo-angular';
import { compraQuery, deleteCompraQuery, comprasSearch, saveCompra } from './graphql/compra/graphql-query';
import { EditCompraComponent } from './edit-compra/edit-compra.component';
import { ListCompraComponent } from './list-compra/list-compra.component';
import { CompraItemByProductoIdGQL } from './graphql/compraItemPorProducto';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Observable } from 'rxjs';
import { CompraItem, CompraItemInput } from './compra-item.model';
import { SaveCompraItemGQL } from './graphql/saveCompraItem';
import { DeleteCompraItemGQL } from './graphql/deleteCompraItem';
import { SaveCompraGQL } from './graphql/compra/saveCompra';
import { DeleteCompraGQL } from './graphql/compra/deleteCompra';
import { Compra, CompraInput } from './compra.model';
import { CompraItemPorIdGQL } from './graphql/compraItemPorId';

@Injectable({
  providedIn: 'root'
})
export class CompraService {

  constructor( 
    private compraItemPorProducto: CompraItemByProductoIdGQL,
    private genericService: GenericCrudService,
    private saveCompraItem: SaveCompraItemGQL,
    private deleteCompraItem: DeleteCompraItemGQL,
    private saveCompra: SaveCompraGQL,
    private deleteCompra: DeleteCompraGQL,
    private compraItemPorId: CompraItemPorIdGQL
  ){}

  getItemPorProductoId(id): Observable<CompraItem[]>{
    return this.genericService.onGetById(this.compraItemPorProducto, id);
  }

  onSaveCompra(input: CompraInput): Observable<Compra>{
    return this.genericService.onSave(this.saveCompra, input);
  }

  onDeleteCompra(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteCompra, id);
  }

  onSaveCompraItem(input: CompraItemInput): Observable<CompraItem>{
    return this.genericService.onSave(this.saveCompraItem, input);
  }

  onDeleteCompraItem(id: number): Observable<boolean>{
    return this.genericService.onSave(this.deleteCompraItem, id);
  }

  onGetCompraItemPorId(id: number): Observable<CompraItem> {
    return this.genericService.onGetById(this.compraItemPorId, id)
  }

}
