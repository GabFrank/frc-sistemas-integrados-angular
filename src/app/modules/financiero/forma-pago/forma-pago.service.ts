import { Injectable } from "@angular/core";
import { Form } from "@angular/forms";
import { BehaviorSubject, Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { FormaPago } from "./forma-pago.model";
import { FormaPagoGetAllGQL } from "./graphql/allFormaPago";
import { FormaPagoByIdGQL } from "./graphql/formaPagoById";

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

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
    private genericService: GenericCrudService
  ) {
    this.onGetAllFormaPago().pipe(untilDestroyed(this)).subscribe(res => {
      this.formaPagoList = res;
      this.formaPagoSub.next(res);
    })
  }

  onGetFormaPago(id) {
    return this.getFormaPago.fetch(
      {
        id,
      },
      {
        fetchPolicy: "no-cache",
        errorPolicy: "all",
      }
    );
  }

  onGetAllFormaPago(): Observable<any> {
    return this.genericService.onGetAll(this.getAllFormaPago);
  }
}
