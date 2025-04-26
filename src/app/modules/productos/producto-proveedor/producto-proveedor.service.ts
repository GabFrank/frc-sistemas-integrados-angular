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

  getByProveedorId(id: number, texto: string, page: number, size: number): Observable<PageInfo<ProductoProveedor>> {
    return this.genericService.onCustomQuery(this.productoProveedorPorProveedorId, {id,texto, page, size});
  }
}
