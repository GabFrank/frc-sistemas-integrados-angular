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
import { GenericCrudService } from "../../../generics/generic-crud.service";

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

  onSave(input: PrecioPorSucursalInput, servidor = true): Observable<any> {
    input.usuarioId = this.mainService?.usuarioActual?.id;
    return this.genericService.onSave(this.savePrecioPorSucursal, input, null, null, servidor);
  }

  onDelete(precio: PrecioPorSucursal, servidor = true): Observable<boolean> {
    // TODO: Implementar el delete con el generic service
    return this.genericService.onDelete(this.deletePrecioPorSucursal, precio.id, "¿Eliminar precio por sucursal?", null, true, servidor, "¿Está seguro que desea eliminar este precio por sucursal?");
  }

  onGetPrecioPorSurursalPorPresentacionId(id: number, servidor = true) {
    return this.genericService.onGetById(this.getPrecioPorSucursalPorPresentacion, id, null, null, servidor);
  }
}
