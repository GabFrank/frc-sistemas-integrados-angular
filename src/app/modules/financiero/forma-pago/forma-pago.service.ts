import { Injectable } from "@angular/core";
import { Form } from "@angular/forms";
import { BehaviorSubject, Observable } from "rxjs";
import { GenericCrudService, PROPAGAR_ERROR_DE_RED, QueryError, TIMEOUT_CONSULTA_DE_FONDO_MS } from "../../../generics/generic-crud.service";
import { FormaPago } from "./forma-pago.model";
import { FormaPagoGetAllGQL } from "./graphql/allFormaPago";
import { FormaPagoByIdGQL } from "./graphql/formaPagoById";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from "../../../main.service";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class FormaPagoService {
  formaPagoSub = new BehaviorSubject<FormaPago[]>(null);
  formaPagoList: FormaPago[] = []

  constructor(
    private getFormaPago: FormaPagoByIdGQL,
    private getAllFormaPago: FormaPagoGetAllGQL,
    private genericService: GenericCrudService,
    private mainService: MainService
  ) {
    this.onGetAllFormaPago(!this.mainService.isLocal()).pipe(untilDestroyed(this)).subscribe(res => {
      // null = no se pudieron leer (#390): la lista queda vacía, como nace, en vez de null (venta-touch la recorre).
      if (res == null) return;
      this.formaPagoList = res;
      this.formaPagoSub.next(res);
    })
  }

  onGetFormaPago(id, servidor: boolean = true) {
    //use genericService
    return this.genericService.onGetById(this.getFormaPago, id, null, null, servidor);
  }

  /** `null` = no se pudieron leer (el genérico ya avisó, salvo que `errorConf` diga otra cosa). */
  onGetAllFormaPago(servidor: boolean = true, errorConf?: QueryError): Observable<any> {
    return this.genericService.onGetAll(this.getAllFormaPago, null, null, servidor, errorConf);
  }

  /**
   * Para un diálogo que no puede quedar esperando: el onGetAll genérico abre su modal y avisa por su cuenta. Este corta a los 20 s,
   * sin el modal ni el aviso del link, y manda el error de red al llamador; un error GraphQL emite null (#390).
   */
  onGetAllFormaPagoParaDialogo(servidor: boolean = true): Observable<FormaPago[] | null> {
    return this.genericService.onCustomQuery(this.getAllFormaPago, {}, servidor, PROPAGAR_ERROR_DE_RED, true,
      { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true });
  }
}
