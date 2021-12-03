import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { MonedasGetAllGQL } from './graphql/monedasGetAll';

@Injectable({
  providedIn: 'root'
})
export class MonedaService {

  constructor(
    private getAllMonedas: MonedasGetAllGQL,
    private genericService: GenericCrudService
  ) { }

  onGetAll(): Observable<any>{
    return this.genericService.onGetAll(this.getAllMonedas);
  }
}
