import { Injectable } from "@angular/core";
import { Form } from "@angular/forms";
import { BehaviorSubject, Observable } from "rxjs";
import { GenericCrudService } from "../../../generics/generic-crud.service";
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
      this.formaPagoList = res;
      this.formaPagoSub.next(res);
    })
  }

  onGetFormaPago(id, servidor: boolean = true) {
    //use genericService
    return this.genericService.onGetById(this.getFormaPago, id, null, null, servidor);
  }

  onGetAllFormaPago(servidor: boolean = true): Observable<any> {
    return this.genericService.onGetAll(this.getAllFormaPago, null, null, servidor);
  }
}
