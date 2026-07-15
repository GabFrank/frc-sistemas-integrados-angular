import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { PageInfo } from "../../../../app.component";
import { GenericCrudService } from "../../../../generics/generic-crud.service";
import { MainService } from "../../../../main.service";
import { GetColectasDevolucionGQL } from "./graphql/getColectasDevolucion";
import { GetRemitoRetiroGQL } from "./graphql/getRemitoRetiro";
import { GetRetirosDevolucionGQL } from "./graphql/getRetirosDevolucion";
import { RevertirColectaDevolucionGQL } from "./graphql/revertirColectaDevolucion";
import { RevertirEstadoDevolucionGQL } from "./graphql/revertirEstadoDevolucion";
import { RevertirRetiroDevolucionGQL } from "./graphql/revertirRetiroDevolucion";
import { ColectaDevolucionOp, RetiroDevolucionOp } from "./operacion-devolucion.model";

/**
 * Operaciones de devolucion (cabeceras): historiales de retiro/colecta y revert
 * (linea y operacion). Espeja el backend `central` implementado en esta feature.
 */
@Injectable({ providedIn: "root" })
export class OperacionDevolucionService {
  constructor(
    private genericCrudService: GenericCrudService,
    private mainService: MainService,
    private getRetirosGQL: GetRetirosDevolucionGQL,
    private getColectasGQL: GetColectasDevolucionGQL,
    private getRemitoRetiroGQL: GetRemitoRetiroGQL,
    private revertirEstadoGQL: RevertirEstadoDevolucionGQL,
    private revertirRetiroGQL: RevertirRetiroDevolucionGQL,
    private revertirColectaGQL: RevertirColectaDevolucionGQL
  ) {}

  onGetRetiros(
    page = 0,
    size = 20,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<PageInfo<RetiroDevolucionOp>> {
    return this.genericCrudService.onCustomQuery(this.getRetirosGQL, {
      page,
      size,
      fechaInicio: fechaInicio ?? null,
      fechaFin: fechaFin ?? null,
    });
  }

  onGetColectas(
    page = 0,
    size = 20,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<PageInfo<ColectaDevolucionOp>> {
    return this.genericCrudService.onCustomQuery(this.getColectasGQL, {
      page,
      size,
      fechaInicio: fechaInicio ?? null,
      fechaFin: fechaFin ?? null,
    });
  }

  onGetRemitoRetiro(retiroId: number): Observable<string> {
    return this.genericCrudService.onCustomQuery(this.getRemitoRetiroGQL, { retiroId });
  }

  onRevertirEstado(devolucionId: number): Observable<any> {
    return this.genericCrudService.onCustomMutation(this.revertirEstadoGQL, {
      devolucionId,
      usuarioId: this.mainService.usuarioActual?.id,
    });
  }

  onRevertirRetiro(retiroId: number): Observable<any> {
    return this.genericCrudService.onCustomMutation(this.revertirRetiroGQL, {
      retiroId,
      usuarioId: this.mainService.usuarioActual?.id,
    });
  }

  onRevertirColecta(colectaId: number): Observable<any> {
    return this.genericCrudService.onCustomMutation(this.revertirColectaGQL, {
      colectaId,
      usuarioId: this.mainService.usuarioActual?.id,
    });
  }
}
