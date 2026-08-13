import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import {
  ColectarDevolucionGQL,
  ColectarDevolucionesEnBloqueGQL,
} from "./graphql/colecta-devolucion.gql";

/** Colecta interna de devoluciones separadas a un depósito. */
@Injectable({ providedIn: "root" })
export class ColectaDevolucionService {
  constructor(
    private genericService: GenericCrudService,
    private colectarGQL: ColectarDevolucionGQL,
    private colectarBloqueGQL: ColectarDevolucionesEnBloqueGQL
  ) {}

  onColectar(
    devolucionId: number,
    sucursalDestinoId: number,
    usuarioId?: number
  ): Observable<any> {
    return this.genericService.onCustomMutation(this.colectarGQL, {
      devolucionId,
      sucursalDestinoId,
      usuarioId: usuarioId ?? null,
    });
  }

  onColectarEnBloque(
    devolucionIds: number[],
    sucursalDestinoId: number,
    usuarioId?: number
  ): Observable<any> {
    return this.genericService.onCustomMutation(this.colectarBloqueGQL, {
      devolucionIds,
      sucursalDestinoId,
      usuarioId: usuarioId ?? null,
    });
  }
}
