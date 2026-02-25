import { Injectable } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { Tab } from "../../../layouts/tab/tab.model";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
import { NotificacionSnackbarService } from "../../../notificacion-snackbar.service";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import { ReporteService } from "../../reportes/reporte.service";
import { ReportesComponent } from "../../reportes/reportes/reportes.component";
import { CancelarInventarioGQL } from "./graphql/cancelarInventario";
import { DeleteInventarioGQL } from "./graphql/deleteInventario";
import { DeleteInventarioProductoGQL } from "./graphql/deleteInventarioProducto";
import { DeleteInventarioProductoItemGQL } from "./graphql/deleteInventarioProductoItem";
import { FinalizarInventarioGQL } from "./graphql/finalizarInventario";
import { GetInventarioGQL } from "./graphql/getInventario";
import { GetInventarioAbiertoPorSucursalGQL } from "./graphql/getInventarioAbiertoPorSucursal";
import { GetInventarioPorFechaGQL } from "./graphql/getInventarioPorFecha";
import { GetInventarioPorUsuarioGQL } from "./graphql/getInventarioPorUsuario";
import { GetInventarioProductoGQL } from "./graphql/getInventarioProducto";
import { GetInventarioProductoItemGQL } from "./graphql/getInventarioProductoItem";
import { InventarioProductoItemWithFiltersGQL } from "./graphql/getInventarioProductoItemWithFilters";
import { GetInventarioProductosItemPorInventarioProductoGQL } from "./graphql/getInventarioProductosItemPorInventarioProducto";
import { reporteInventarioGQL } from "./graphql/getReporteInventario";
import { ReabrirInventarioGQL } from "./graphql/reabrirInventario";
import { SaveInventarioGQL } from "./graphql/saveInventario";
import { SaveInventarioProductoGQL } from "./graphql/saveInventarioProducto";
import { SaveInventarioProductoItemGQL } from "./graphql/saveInventarioProductoItem";
import {
  Inventario,
  InventarioProducto,
  InventarioProductoItem,
} from "./inventario.model";
import { ListInventarioComponent } from "./list-inventario/list-inventario.component";

@UntilDestroy()
@Injectable({
  providedIn: "root",
})
export class InventarioService {
  constructor(
    private genericCrudService: GenericCrudService,
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
    private inventarioAbiertoPorSucursal: GetInventarioAbiertoPorSucursalGQL,
    private inventarioProductoItemWithFilters: InventarioProductoItemWithFiltersGQL,
    private reporteInventario: reporteInventarioGQL,
    private reporteService: ReporteService,
    private tabService: TabService,
    private getInventarioProductoItem: GetInventarioProductoItemGQL,
    private getInventarioProducto: GetInventarioProductoGQL,
    private getInventarioProductosItemPorInventarioProducto: GetInventarioProductosItemPorInventarioProductoGQL,
    private finalizarInventario: FinalizarInventarioGQL,
    private cancelarInventario: CancelarInventarioGQL,
    private reabrirInventario: ReabrirInventarioGQL
  ) { }

  onGetInventarioPorFecha(inicio, fin) {
    return this.genericCrudService.onGetByFecha(
      this.getInventariosPorFecha,
      inicio,
      fin
    );
  }

  onGetInventarioAbiertoPorSucursal(sucursalId?: number): Observable<Inventario[]> {
    const id = sucursalId || this.mainService.sucursalActual.id;
    return this.genericCrudService.onGetById(
      this.inventarioAbiertoPorSucursal,
      id
    );
  }

  onGetInventarioUsuario(): Observable<Inventario[]> {
    return this.genericCrudService.onGetById(
      this.inventarioPorUsuario,
      this.mainService.usuarioActual.id
    );
  }

  onGetInventario(id): Observable<Inventario> {
    return this.genericCrudService.onGetById(this.getInventario, id);
  }

  onSaveInventario(input): Observable<Inventario> {
    return this.genericCrudService.onSave(this.saveInventario, input);
  }

  onDeleteInventario(id): Observable<boolean> {
    return this.genericCrudService.onDelete(
      this.deleteTransfencia,
      id,
      "¿Eliminar inventario?",
      null,
      true,
      true,
      "¿Está seguro que desea eliminar este inventario?"
    );
  }

  onSaveInventarioProducto(input): Observable<InventarioProducto> {
    return this.genericCrudService.onSave(this.saveInventarioProducto, input);
  }

  onDeleteInventarioProducto(id): Observable<boolean> {
    return this.genericCrudService.onDelete(
      this.deleteInventarioProducto,
      id,
      "¿Eliminar inventario producto?",
      null,
      true,
      true,
      "¿Está seguro que desea eliminar este inventario producto?"
    );
  }

  onSaveInventarioProductoItem(input): Observable<InventarioProducto> {
    return this.genericCrudService.onSave(
      this.saveInventarioProductoItem,
      input
    );
  }

  onDeleteInventarioProductoItem(id): Observable<boolean> {
    return this.genericCrudService.onDelete(
      this.deleteInventarioProductoItem,
      id,
      "¿Eliminar inventario producto item?",
      null,
      true,
      true,
      "¿Está seguro que desea eliminar este inventario producto item?"
    );
  }

  onGetInventarioProductoItemWithFilters(
    startDate: string,
    endDate: string,
    page: number,
    size: number,
    orderBy: string,
    tipoOrder: string,
    sucursalIdList?: number[],
    usuarioIdList?: number[],
    productoIdList?: number[],
    estado?: string
  ) {
    return this.genericCrudService.onCustomQuery(
      this.inventarioProductoItemWithFilters,
      {
        startDate,
        endDate,
        sucursalIdList,
        usuarioIdList,
        productoIdList,
        page,
        size,
        orderBy,
        tipoOrder,
        estado,
      }
    );
  }

  onGetReporteInventario(
    startDate: string,
    endDate: string,
    page: number,
    size: number,
    orderBy: string,
    tipoOrder: string,
    nickname: string,
    sucursalIdList?: number[],
    usuarioIdList?: number[],
    productoIdList?: number[]
  ) {
    this.genericCrudService
      .onCustomQuery(
        this.reporteInventario,
        {
          startDate,
          endDate,
          page,
          size,
          orderBy,
          tipoOrder,
          sucursalIdList,
          usuarioIdList,
          productoIdList,
          nickname: this.mainService.usuarioActual.nickname,
        },
        true
      )
      .subscribe((res) => {
        if (res != null) {
          this.reporteService.onAdd("Inventario Producto " + Date.now(), res);
          this.tabService.addTab(
            new Tab(
              ReportesComponent,
              "Reportes",
              null,
              ListInventarioComponent
            )
          );
        }
      });
  }

  onGetInventarioProductoItem(id: number): Observable<InventarioProductoItem> {
    return this.genericCrudService.onGetById(
      this.getInventarioProductoItem,
      id
    );
  }

  /**
   * Obtiene un InventarioProducto por ID
   * @param id ID del inventario producto
   * @returns Observable con el inventario producto
   */
  onGetInventarioProducto(id: number): Observable<InventarioProducto> {
    return this.genericCrudService.onGetById(
      this.getInventarioProducto,
      id
    );
  }

  /**
   * Obtiene los items de inventario por inventario producto
   * @param id ID del inventario producto
   * @param page Página
   * @param size Tamaño de página
   * @returns Observable con los items
   */
  onGetInventarioProductosItemPorInventarioProducto(
    id: number,
    page: number = 0,
    size: number = 100
  ): Observable<InventarioProductoItem[]> {
    return this.genericCrudService.onCustomQuery(
      this.getInventarioProductosItemPorInventarioProducto,
      { id, page, size }
    );
  }

  /**
   * Finaliza un inventario (cambia estado a CONCLUIDO)
   * @param id ID del inventario
   * @returns Observable con el inventario actualizado
   */
  onFinalizarInventario(id: number): Observable<Inventario> {
    return this.genericCrudService.onCustomMutation(
      this.finalizarInventario,
      { id }
    );
  }

  /**
   * Cancela un inventario
   * @param id ID del inventario
   * @returns Observable con resultado booleano
   */
  onCancelarInventario(id: number): Observable<boolean> {
    return this.genericCrudService.onCustomMutation(
      this.cancelarInventario,
      { id }
    );
  }

  /**
   * Reabre un inventario cancelado
   * @param id ID del inventario
   * @returns Observable con resultado booleano
   */
  onReabrirInventario(id: number): Observable<boolean> {
    return this.genericCrudService.onCustomMutation(
      this.reabrirInventario,
      { id }
    );
  }
}
