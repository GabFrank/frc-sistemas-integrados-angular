import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { FormaPago } from "./forma-pago.model";
import { FormaPagoGetAllGQL } from "./graphql/allFormaPago";
import { FormaPagoByIdGQL } from "./graphql/formaPagoById";

@Injectable({
  providedIn: "root",
})
export class FormaPagoService {
  constructor(
    private getFormaPago: FormaPagoByIdGQL,
    private getAllFormaPago: FormaPagoGetAllGQL
  ) {}

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

  onGetAllFormaPago(): Observable<FormaPago[] | null> {
    return new Observable((obs) => {
      this.getAllFormaPago.fetch(
        {},
        {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        }
      ).subscribe(res => {
        console.log(res)
        if(res.errors==null){
        
          obs.next(res.data.data)
        } else {
          //"Validation error of type FieldUndefined: Field 'formasPagos' in type 'Query' is undefined @ 'formasPagos'"
        }
      })
    });
  }
}
