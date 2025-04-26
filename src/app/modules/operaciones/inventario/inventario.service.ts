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
import { DeleteInventarioGQL } from "./graphql/deleteInventario";
import { DeleteInventarioProductoGQL } from "./graphql/deleteInventarioProducto";
import { DeleteInventarioProductoItemGQL } from "./graphql/deleteInventarioProductoItem";
import { GetInventarioGQL } from "./graphql/getInventario";
import { GetInventarioAbiertoPorSucursalGQL } from "./graphql/getInventarioAbiertoPorSucursal";
import { GetInventarioPorFechaGQL } from "./graphql/getInventarioPorFecha";
import { GetInventarioPorUsuarioGQL } from "./graphql/getInventarioPorUsuario";
import { GetInventarioProductoItemGQL } from "./graphql/getInventarioProductoItem";
import { InventarioProductoItemWithFiltersGQL } from "./graphql/getInventarioProductoItemWithFilters";
import { reporteInventarioGQL } from "./graphql/getReporteInventario";
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
    private getInventarioProductoItem: GetInventarioProductoItemGQL
  ) {}

  onGetInventarioPorFecha(inicio, fin) {
    return this.genericCrudService.onGetByFecha(
      this.getInventariosPorFecha,
      inicio,
      fin
    );
  }

  onGetInventarioAbiertoPorSucursal() {
    return this.genericCrudService.onGetById(
      this.inventarioAbiertoPorSucursal,
      this.mainService.sucursalActual.id
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
      "Realmente  desea eliminar esta inventario?"
    );
  }

  onSaveInventarioProducto(input): Observable<InventarioProducto> {
    return this.genericCrudService.onSave(this.saveInventarioProducto, input);
  }

  onDeleteInventarioProducto(id): Observable<boolean> {
    return this.genericCrudService.onDelete(
      this.deleteInventarioProducto,
      id,
      "Realmente  desea eliminar este item"
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
      "Realmente  desea eliminar este item"
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
    productoIdList?: number[]
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
}
