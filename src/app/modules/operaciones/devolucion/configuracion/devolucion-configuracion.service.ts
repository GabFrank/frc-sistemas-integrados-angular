import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { DevolucionConfiguracion } from "./devolucion-configuracion.model";
import {
  DevolucionConfiguracionGQL,
  GuardarDevolucionConfiguracionGQL,
} from "./graphql/devolucion-configuracion.gql";

/** Acceso a la configuración del módulo de devoluciones (fila única). */
@Injectable({ providedIn: "root" })
export class DevolucionConfiguracionService {
  constructor(
    private genericService: GenericCrudService,
    private getGQL: DevolucionConfiguracionGQL,
    private guardarGQL: GuardarDevolucionConfiguracionGQL
  ) {}

  onGet(): Observable<DevolucionConfiguracion> {
    return this.genericService.onCustomQuery(
      this.getGQL,
      {},
      true,
      undefined,
      true
    );
  }

  onGuardar(
    input: DevolucionConfiguracion
  ): Observable<DevolucionConfiguracion> {
    return this.genericService.onCustomMutation(this.guardarGQL, { input });
  }
}
