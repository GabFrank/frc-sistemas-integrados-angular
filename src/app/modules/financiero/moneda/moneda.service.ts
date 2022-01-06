import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { MonedasGetAllGQL } from './graphql/monedasGetAll';
import { Moneda } from './moneda.model';

@Injectable({
  providedIn: 'root'
})
export class MonedaService {

  monedaList: Moneda[]

  constructor(
    private getAllMonedas: MonedasGetAllGQL,
    private genericService: GenericCrudService
  ) { 
    this.onGetAll().subscribe(res => {
      if(res!=null){
        this.monedaList = res;
      }
    })
  }

  onGetAll(): Observable<Moneda[]>{
    return this.genericService.onGetAll(this.getAllMonedas);
  }
}
