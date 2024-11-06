import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { MonedasGetAllGQL } from './graphql/monedasGetAll';
import { Moneda } from './moneda.model';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CurrencyMaskInputMode } from 'ngx-currency';
import { UsuarioService } from '../../personas/usuarios/usuario.service';
import { MainService } from '../../../main.service';

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
    private genericService: GenericCrudService,
    private mainService: MainService
  ) { 
    mainService.usuarioActual != null ? this.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      if(res!=null){
        this.monedaList = res;
      }
    }) : null;
  }

  onGetAll(): Observable<Moneda[]>{
    if(this.monedaList?.length > 0) return of(this.monedaList);
    return this.genericService.onGetAll(this.getAllMonedas);
  }
}
