import { GetInventarioAbiertoPorSucursalGQL } from './graphql/getInventarioAbiertoPorSucursal';
import { GetInventarioPorUsuarioGQL } from './graphql/getInventarioPorUsuario';
import { inventarioPorUsuarioQuery } from './graphql/graphql-query';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Injectable } from '@angular/core';
import { untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { MainService } from '../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../notificacion-snackbar.service';
import { DialogosService } from '../../../shared/components/dialogos/dialogos.service';
import { DeleteInventarioGQL } from './graphql/deleteInventario';
import { DeleteInventarioProductoGQL } from './graphql/deleteInventarioProducto';
import { DeleteInventarioProductoItemGQL } from './graphql/deleteInventarioProductoItem';
import { GetInventarioGQL } from './graphql/getInventario';
import { GetInventarioPorFechaGQL } from './graphql/getInventarioPorFecha';
import { SaveInventarioGQL } from './graphql/saveInventario';
import { SaveInventarioProductoGQL } from './graphql/saveInventarioProducto';
import { SaveInventarioProductoItemGQL } from './graphql/saveInventarioProductoItem';
import { Inventario, InventarioEstado, InventarioProducto } from './inventario.model';


@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  constructor(private genericCrudService: GenericCrudService,
    private getInventario: GetInventarioGQL,
    private saveInventario: SaveInventarioGQL,
    private deleteTransfencia: DeleteInventarioGQL,
    private saveInventarioProducto: SaveInventarioProductoGQL,
    private deleteInventarioProducto: DeleteInventarioProductoGQL,
    private saveInventarioProductoItem: SaveInventarioProductoItemGQL,
    private deleteInventarioProductoItem: DeleteInventarioProductoItemGQL,
    private dialogoService: DialogosService,
    private notificacionService: NotificacionSnackbarService,
    private getInventariosPorFecha: GetInventarioPorFechaGQL,
    private mainService: MainService,
    private inventarioPorUsuario: GetInventarioPorUsuarioGQL,
    private inventarioAbiertoPorSucursal: GetInventarioAbiertoPorSucursalGQL
  ) { }

  onGetInventarioPorFecha(inicio, fin) {
    return this.genericCrudService.onGetByFecha(this.getInventariosPorFecha, inicio, fin);
  }

  onGetInventarioAbiertoPorSucursal() {
    return this.genericCrudService.onGetById(this.inventarioAbiertoPorSucursal, this.mainService.sucursalActual.id);
  }

  onGetInventarioUsuario(): Observable<Inventario[]> {
    return this.genericCrudService.onGetById(this.inventarioPorUsuario, this.mainService.usuarioActual.id);
  }

  onGetInventario(id): Observable<Inventario> {
    return this.genericCrudService.onGetById(this.getInventario, id);
  }

  onSaveInventario(input): Observable<Inventario> {
    return this.genericCrudService.onSave(this.saveInventario, input);
  }

  onDeleteInventario(id): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteTransfencia, id, 'Realmente  desea eliminar esta inventario?')
  }

  onSaveInventarioProducto(input): Observable<InventarioProducto> {
    return this.genericCrudService.onSave(this.saveInventarioProducto, input);
  }

  onDeleteInventarioProducto(id): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteInventarioProducto, id, 'Realmente  desea eliminar este item')
  }

  onSaveInventarioProductoItem(input): Observable<InventarioProducto> {
    return this.genericCrudService.onSave(this.saveInventarioProductoItem, input);
  }

  onDeleteInventarioProductoItem(id): Observable<boolean> {
    return this.genericCrudService.onDelete(this.deleteInventarioProductoItem, id, 'Realmente  desea eliminar este item')
  }

}
