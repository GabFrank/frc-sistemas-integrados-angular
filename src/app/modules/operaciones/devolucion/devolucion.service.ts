import { Injectable } from "@angular/core";
import { UntilDestroy } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { PageInfo } from "../../../app.component";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { MainService } from "../../../main.service";
import {
  Devolucion,
  DevolucionEstado,
  DevolucionInput,
  DevolucionItem,
  DevolucionItemInput,
  MotivoAveria,
} from "./devolucion.model";
import { AcreditarDevolucionGQL } from "./graphql/acreditarDevolucion";
import { AvanzarEstadoDevolucionGQL } from "./graphql/avanzarEstadoDevolucion";
import { CancelarDevolucionGQL } from "./graphql/cancelarDevolucion";
import { DeleteDevolucionItemGQL } from "./graphql/deleteDevolucionItem";
import { GetDevolucionGQL } from "./graphql/getDevolucion";
import { GetDevolucionItemsPorDevolucionGQL } from "./graphql/getDevolucionItemsPorDevolucion";
import { GetDevolucionesConFiltrosGQL } from "./graphql/getDevolucionesConFiltros";
import { GetDevolucionesPendientesPorProveedorGQL } from "./graphql/getDevolucionesPendientesPorProveedor";
import { GetMotivosAveriaGQL } from "./graphql/getMotivosAveria";
import { SaveDevolucionGQL } from "./graphql/saveDevolucion";
import { SaveDevolucionItemGQL } from "./graphql/saveDevolucionItem";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class DevolucionService {
  constructor(
    private genericCrudService: GenericCrudService,
    private mainService: MainService,
    private getDevolucionGQL: GetDevolucionGQL,
    private getDevolucionesConFiltrosGQL: GetDevolucionesConFiltrosGQL,
    private getDevolucionesPendientesPorProveedorGQL: GetDevolucionesPendientesPorProveedorGQL,
    private getDevolucionItemsPorDevolucionGQL: GetDevolucionItemsPorDevolucionGQL,
    private getMotivosAveriaGQL: GetMotivosAveriaGQL,
    private saveDevolucionGQL: SaveDevolucionGQL,
    private saveDevolucionItemGQL: SaveDevolucionItemGQL,
    private deleteDevolucionItemGQL: DeleteDevolucionItemGQL,
    private avanzarEstadoDevolucionGQL: AvanzarEstadoDevolucionGQL,
    private acreditarDevolucionGQL: AcreditarDevolucionGQL,
    private cancelarDevolucionGQL: CancelarDevolucionGQL
  ) {}

  onGetDevolucion(id, servidor = true): Observable<Devolucion> {
    return this.genericCrudService.onGetById(
      this.getDevolucionGQL,
      id,
      null,
      null,
      servidor
    );
  }

  onGetDevolucionesConFiltros(
    proveedorId?: number,
    sucursalId?: number,
    estado?: DevolucionEstado,
    fechaInicio?: string,
    fechaFin?: string,
    page?: number,
    size?: number,
    servidor = true
  ): Observable<PageInfo<Devolucion>> {
    return this.genericCrudService.onCustomQuery(
      this.getDevolucionesConFiltrosGQL,
      {
        proveedorId,
        sucursalId,
        estado,
        fechaInicio,
        fechaFin,
        page,
        size,
      },
      servidor
    );
  }

  onGetDevolucionesPendientesPorProveedor(
    proveedorId: number,
    servidor = true
  ): Observable<Devolucion[]> {
    return this.genericCrudService.onCustomQuery(
      this.getDevolucionesPendientesPorProveedorGQL,
      { proveedorId },
      servidor,
      null,
      true
    );
  }

  onGetDevolucionItemsPorDevolucion(
    devolucionId: number,
    servidor = true
  ): Observable<DevolucionItem[]> {
    return this.genericCrudService.onCustomQuery(
      this.getDevolucionItemsPorDevolucionGQL,
      { devolucionId },
      servidor
    );
  }

  onGetMotivosAveriaActivos(servidor = true): Observable<MotivoAveria[]> {
    return this.genericCrudService.onCustomQuery(
      this.getMotivosAveriaGQL,
      {},
      servidor,
      null,
      true
    );
  }

  onSaveDevolucion(
    input: DevolucionInput,
    servidor = true
  ): Observable<Devolucion> {
    if (input.usuarioId == null) {
      input.usuarioId = this.mainService.usuarioActual?.id;
    }
    return this.genericCrudService.onSave(
      this.saveDevolucionGQL,
      input,
      null,
      null,
      servidor
    );
  }

  onSaveDevolucionItem(
    input: DevolucionItemInput,
    servidor = true
  ): Observable<DevolucionItem> {
    return this.genericCrudService.onSaveCustom(
      this.saveDevolucionItemGQL,
      { entity: input },
      servidor
    );
  }

  onDeleteDevolucionItem(id, servidor = true): Observable<boolean> {
    return this.genericCrudService.onDelete(
      this.deleteDevolucionItemGQL,
      id,
      "¿Eliminar item de devolución?",
      null,
      true,
      servidor,
      "¿Está seguro que desea eliminar este item de devolución?"
    );
  }

  onAvanzarEstado(
    devolucionId: number,
    estado: DevolucionEstado,
    servidor = true
  ): Observable<Devolucion> {
    return this.genericCrudService.onCustomMutation(
      this.avanzarEstadoDevolucionGQL,
      {
        devolucionId,
        estado,
        usuarioId: this.mainService.usuarioActual?.id,
      },
      servidor
    );
  }

  onAcreditar(
    devolucionId: number,
    nroNotaCredito: string,
    montoAcreditado: number,
    servidor = true
  ): Observable<Devolucion> {
    return this.genericCrudService.onCustomMutation(
      this.acreditarDevolucionGQL,
      {
        devolucionId,
        nroNotaCredito,
        montoAcreditado,
        usuarioId: this.mainService.usuarioActual?.id,
      },
      servidor
    );
  }

  onCancelar(
    devolucionId: number,
    motivoCancelacion: string,
    servidor = true
  ): Observable<Devolucion> {
    return this.genericCrudService.onCustomMutation(
      this.cancelarDevolucionGQL,
      { devolucionId, motivoCancelacion },
      servidor
    );
  }
}
