import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { MonedasGetAllGQL } from './graphql/monedasGetAll';
import { Moneda } from './moneda.model';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CurrencyMaskInputMode } from 'ngx-currency';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: 'root'
})
export class MonedaService {

  monedaList: Moneda[]

  currencyOptionsGuarani = {
    allowNegative: true,
    precision: 0,
    thousands: ".",
    nullable: false,
    inputMode: CurrencyMaskInputMode.NATURAL,
    align: "right",
    allowZero: true,
    decimal: null,
    prefix: "",
    suffix: "",
    max: null,
    min: null,
  };

  currencyOptionsNoGuarani = {
    allowNegative: true,
    precision: 2,
    thousands: ",",
    nullable: false,
    inputMode: CurrencyMaskInputMode.FINANCIAL,
    align: "right",
    allowZero: true,
    decimal: ".",
    prefix: "",
    suffix: "",
    max: null,
    min: null,
  };

  constructor(
    private getAllMonedas: MonedasGetAllGQL,
    private genericService: GenericCrudService
  ) { 
    this.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        this.monedaList = res;
      }
    })
  }

  onGetAll(): Observable<Moneda[]>{
    return this.genericService.onGetAll(this.getAllMonedas);
  }
}
