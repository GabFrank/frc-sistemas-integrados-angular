import { Injectable } from '@angular/core';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Observable } from 'rxjs';
import { ProductoProveedor } from './producto-proveedor.model';
import { ProductoProveedorPorProveedorIdGQL } from './graphql/productoProveedorPorProveedorId';
import { PageInfo } from '../../../app.component';

@Injectable({
  providedIn: 'root'
})
export class ProductoProveedorService {

  constructor(
    private genericService: GenericCrudService,
    private productoProveedorPorProveedorId: ProductoProveedorPorProveedorIdGQL
  ) { }

  getByProveedorId(id: number, page: number, size: number): Observable<PageInfo<ProductoProveedor>> {
    return this.genericService.onGetById(this.productoProveedorPorProveedorId, id, page, size);
  }
}
