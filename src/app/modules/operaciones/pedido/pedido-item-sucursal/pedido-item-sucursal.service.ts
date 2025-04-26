import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { PedidoItemSucursal, PedidoItemSucursalInput } from './pedido-item-sucursal.model';
import { GetPedidoItemSucursalGQL } from './graphql/getPedidoItemSucursal';
import { GetPedidoItensSucursalGQL } from './graphql/getPedidoItensSucursal';
import { CountPedidoItemSucursalGQL } from './graphql/countPedidoItemSucursal';
import { SavePedidoItemSucursalGQL } from './graphql/savePedidoItemSucursal';
import { DeletePedidoItemSucursalGQL } from './graphql/deletePedidoItemSucursal';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { CargandoDialogService } from '../../../../shared/components/cargando-dialog/cargando-dialog.service';
import { GetPedidoItensSucursalByPedidoItemGQL } from './graphql/getPedidoItensSucursalByPedidoItem';

@Injectable({
  providedIn: 'root'
})
export class PedidoItemSucursalService {
  constructor(
    private getPedidoItemSucursalGQL: GetPedidoItemSucursalGQL,
    private getPedidoItensSucursalGQL: GetPedidoItensSucursalGQL,
    private countPedidoItemSucursalGQL: CountPedidoItemSucursalGQL,
    private savePedidoItemSucursalGQL: SavePedidoItemSucursalGQL,
    private deletePedidoItemSucursalGQL: DeletePedidoItemSucursalGQL,
    private genericService: GenericCrudService,
    private mainService: MainService,
    private notificacionBar: NotificacionSnackbarService,
    private getPedidoItensSucursalByPedidoItemGQL: GetPedidoItensSucursalByPedidoItemGQL,
  ) {}

  /**
   * Obtiene un PedidoItemSucursal por su ID
   * @param id ID del PedidoItemSucursal
   */
  onGetPedidoItemSucursal(id: number): Observable<PedidoItemSucursal> {
    return this.genericService.onGetById(this.getPedidoItemSucursalGQL, id);
  }

  /**
   * Obtiene una lista paginada de PedidoItemSucursal
   * @param page Número de página
   * @param size Tamaño de página
   */
  onGetPedidoItensSucursal(page: number = 0, size: number = 10): Observable<PedidoItemSucursal[]> {
    return this.genericService.onGetAll(this.getPedidoItensSucursalGQL, page, size);
  }

  /**
   * Obtiene el conteo total de PedidoItemSucursal
   */
  onCountPedidoItemSucursal(): Observable<number> {
    return this.genericService.onCustomQuery(this.countPedidoItemSucursalGQL, {});
  }

  /**
   * Guarda o actualiza un PedidoItemSucursal
   * @param input Datos del PedidoItemSucursal a guardar
   */
  onSavePedidoItemSucursal(pedidoItemSucursal: PedidoItemSucursalInput): Observable<PedidoItemSucursal> {
    return this.genericService.onCustomMutation(this.savePedidoItemSucursalGQL, {entity: pedidoItemSucursal});
  }

  /**
   * Elimina un PedidoItemSucursal por su ID
   * @param id ID del PedidoItemSucursal a eliminar
   */
  onDeletePedidoItemSucursal(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deletePedidoItemSucursalGQL, id, 'pedido item sucursal');
  }

  /**
   * Obtiene lista de PedidoItemSucursal por ID del PedidoItem
   * @param pedidoItemId ID del PedidoItem
   */
  onGetPedidoItensSucursalByPedidoItem(id: number): Observable<PedidoItemSucursal[]> {
    return this.genericService.onCustomQuery(this.getPedidoItensSucursalByPedidoItemGQL, { id });
  }
} 