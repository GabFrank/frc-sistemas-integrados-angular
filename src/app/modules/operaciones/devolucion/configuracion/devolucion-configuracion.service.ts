import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ContextoConsulta, GenericCrudService, QueryError } from "../../../../generics/generic-crud.service";
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

  /** El central crea la fila si no existe: un null es un error. `errorConf`/`contexto` opt-in (#390). */
  onGet(errorConf?: QueryError, contexto?: ContextoConsulta): Observable<DevolucionConfiguracion> {
    return this.genericService.onCustomQuery(
      this.getGQL,
      {},
      true,
      errorConf,
      true,
      contexto
    );
  }

  onGuardar(
    input: DevolucionConfiguracion
  ): Observable<DevolucionConfiguracion> {
    return this.genericService.onCustomMutation(this.guardarGQL, { input });
  }
}
