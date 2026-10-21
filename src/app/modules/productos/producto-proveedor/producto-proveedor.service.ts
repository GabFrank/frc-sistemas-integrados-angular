import { Injectable } from '@angular/core';
import { ContextoConsulta, GenericCrudService, QueryError } from '../../../generics/generic-crud.service';
import { Observable } from 'rxjs';
import { ProductoProveedor } from './producto-proveedor.model';
import { ProductoProveedorPorProveedorIdGQL } from './graphql/productoProveedorPorProveedorId';
import { ProductoProveedorPorProductoIdGQL } from './graphql/productoProveedorPorProductoId';
import { SaveProductoProveedorGQL } from './graphql/saveProductoProveedor';
import { PageInfo } from '../../../app.component';
import { DesvincularProductoProveedorGQL } from './graphql/desvincularProductoProveedor';

@Injectable({
  providedIn: 'root'
})
export class ProductoProveedorService {

  constructor(
    private genericService: GenericCrudService,
    private productoProveedorPorProveedorId: ProductoProveedorPorProveedorIdGQL,
    private productoProveedorPorProductoId: ProductoProveedorPorProductoIdGQL,
    private saveProductoProveedorGQL: SaveProductoProveedorGQL,
    private desvincularProductoProveedorGQL: DesvincularProductoProveedorGQL
  ) { }

  getByProveedorId(id: number, texto: string, page: number, size: number, pedidoId?: number, silentLoad?: boolean,
                   errorConf?: QueryError, contexto?: ContextoConsulta): Observable<PageInfo<ProductoProveedor>> {
    return this.genericService.onCustomQuery(
      this.productoProveedorPorProveedorId,
      { id, texto, page, size, pedidoId },
      true,
      errorConf,
      silentLoad,
      contexto
    );
  }

  getByProductoId(productoId: number, page: number, size: number, silentLoad?: boolean,
                  errorConf?: QueryError, contexto?: ContextoConsulta): Observable<PageInfo<ProductoProveedor>> {
    return this.genericService.onCustomQuery(
      this.productoProveedorPorProductoId,
      { id: productoId, page, size },
      true,
      errorConf,
      silentLoad,
      contexto
    );
  }

  saveProductoProveedor(input: { productoId: number; proveedorId: number; usuarioId?: number }): Observable<ProductoProveedor> {
    return this.genericService.onSaveCustom(this.saveProductoProveedorGQL, { input });
  }

  /**
   * Desvincula con motivo. Por el genérico: «Guardando…» y el motivo del rechazo; antes cada pantalla hacía el
   * mutate a mano (#501). Emite el vínculo, o null si el central no lo encontró.
   */
  onDesvincular(id: number, motivo: string): Observable<any> {
    return this.genericService.onCustomMutation(this.desvincularProductoProveedorGQL, { id, motivo });
  }
}
