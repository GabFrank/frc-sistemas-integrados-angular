import { Injectable } from '@angular/core';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Observable } from 'rxjs';
import { ProductoProveedor } from './producto-proveedor.model';
import { ProductoProveedorPorProveedorIdGQL } from './graphql/productoProveedorPorProveedorId';
import { ProductoProveedorPorProductoIdGQL } from './graphql/productoProveedorPorProductoId';
import { SaveProductoProveedorGQL } from './graphql/saveProductoProveedor';
import { PageInfo } from '../../../app.component';

@Injectable({
  providedIn: 'root'
})
export class ProductoProveedorService {

  constructor(
    private genericService: GenericCrudService,
    private productoProveedorPorProveedorId: ProductoProveedorPorProveedorIdGQL,
    private productoProveedorPorProductoId: ProductoProveedorPorProductoIdGQL,
    private saveProductoProveedorGQL: SaveProductoProveedorGQL
  ) { }

  getByProveedorId(id: number, texto: string, page: number, size: number, pedidoId?: number, silentLoad?: boolean): Observable<PageInfo<ProductoProveedor>> {
    return this.genericService.onCustomQuery(
      this.productoProveedorPorProveedorId,
      { id, texto, page, size, pedidoId },
      true,
      undefined,
      silentLoad
    );
  }

  getByProductoId(productoId: number, page: number, size: number, silentLoad?: boolean): Observable<PageInfo<ProductoProveedor>> {
    return this.genericService.onCustomQuery(
      this.productoProveedorPorProductoId,
      { id: productoId, page, size },
      true,
      undefined,
      silentLoad
    );
  }

  saveProductoProveedor(input: { productoId: number; proveedorId: number; usuarioId?: number }): Observable<ProductoProveedor> {
    return this.genericService.onSaveCustom(this.saveProductoProveedorGQL, { input });
  }
}
