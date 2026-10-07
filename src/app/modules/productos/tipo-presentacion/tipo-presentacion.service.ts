import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { MainService } from "../../../main.service";
import { FamiliaService } from "../familia/familia.service";
import { AllPresentacionesQueryGQL } from "../presentacion/graphql/allPresentacionesQuery";
import { AllTiposPresentacionesQueryGQL } from "./graphql/all-tipos-presentacion";
import { TipoPresentacion } from "./tipo-presentacion.model";
import { ContextoConsulta, GenericCrudService, QueryError } from "../../../generics/generic-crud.service";

@Injectable({
  providedIn: "root",
})
export class TipoPresentacionService {
  tipoPresentacionList: TipoPresentacion[];
  // presentacionBS = new BehaviorSubject<Presentacion[]>(null);

  constructor(
    private getTipoPresentaciones: AllTiposPresentacionesQueryGQL,
    public mainService: MainService,
    private genericService: GenericCrudService
  ) {}

  // onGetPresentacionesPorProductoId(id){
  //   return this.getPresentacionesPorProductoId.fetch(id, {fetchPolicy: "no-cache"});
  // }

  /** `errorConf` / `contexto`: para quien necesita enterarse del error; sin ellos queda como antes. */
  onGetPresentaciones(servidor = true, errorConf?: QueryError, contexto?: ContextoConsulta) {
    return this.genericService.onCustomQuery(this.getTipoPresentaciones, null, servidor, errorConf, undefined, contexto);
  }

  // onSavePresentacion(presentacionInput: PresentacionInput): Observable<any> {
  //   presentacionInput.usuarioId = this.mainService?.usuarioActual?.id;
  //   return new Observable((obs) => {
  //     this.savePresentacion.mutate({
  //       entity: presentacionInput,
  //     });
  //   });
  // }
  // onDeletePresentacion(id: number) {
  //   return this.deletePresentacion.mutate({
  //     id,
  //   });
  // }
}
