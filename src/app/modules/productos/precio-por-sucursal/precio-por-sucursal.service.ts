import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { MainService } from "../../../main.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import { DeletePrecioPorSucursalGQL } from "./graphql/deletePrecioPorSucursal";
import { PrecioPorSucursalPorPresentacionIdGQL } from "./graphql/precioPorSucursalPorPresentacionId";
import { savePrecioPorSucursalGQL } from "./graphql/savePrecioPorSucursal";
import { PrecioPorSucursalInput } from "./precio-por-sucursal-input.model";
import { PrecioPorSucursal } from "./precio-por-sucursal.model";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError } from "../../../generics/generic-crud.service";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class PrecioPorSucursalService {
  datosObs = new BehaviorSubject<PrecioPorSucursal[]>(null);

  constructor(
    private savePrecioPorSucursal: savePrecioPorSucursalGQL,
    private notificacionSnackBar: NotificacionSnackbarService,
    private deletePrecioPorSucursal: DeletePrecioPorSucursalGQL,
    private getPrecioPorSucursalPorPresentacion: PrecioPorSucursalPorPresentacionIdGQL,
    public mainService: MainService,
    private dialogoService: DialogosService,
    private genericService: GenericCrudService
  ) {}

  /**
   * Propaga el error de red (#390): sin eso el llamador no se entera y deja el modal colgado. Un error que llega
   * como array es un rechazo del servidor (no se guardó); cualquier otro es incierto (pudo haberse guardado).
   */
  onSave(input: PrecioPorSucursalInput, servidor = true): Observable<any> {
    input.usuarioId = this.mainService?.usuarioActual?.id;
    return this.genericService.onSave(this.savePrecioPorSucursal, input, null, null, servidor, PROPAGAR_ERROR_DE_RED);
  }

  onDelete(precio: PrecioPorSucursal, servidor = true): Observable<boolean> {
    // TODO: Implementar el delete con el generic service
    return this.genericService.onDelete(this.deletePrecioPorSucursal, precio.id, "¿Eliminar precio por sucursal?", null, true, servidor, "¿Está seguro que desea eliminar este precio por sucursal?");
  }

  /** Sin `errorConf` un error falla hacia quien llama; con él, uno del servidor emite `null` salvo que se pida propagarlo (#390). */
  onGetPrecioPorSurursalPorPresentacionId(id: number, servidor = true, errorConf?: QueryError,
                                          contexto?: ContextoConsulta, silentLoad?: boolean) {
    return this.genericService.onGetById<PrecioPorSucursal[]>(this.getPrecioPorSucursalPorPresentacion, id, null, null,
      servidor, null, null, null, silentLoad, null, null, errorConf, contexto);
  }
}
