import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CargosGQL } from './graphql/Cargos';
import { CargosSearchGQL } from './graphql/CargosSearch';
import { GenericCrudService } from '../../../generics/generic-crud.service';

@Injectable({
  providedIn: 'root'
})
export class CargoService {

  constructor(
    private genericService: GenericCrudService,
    private getAllCargos: CargosGQL,
    private cargosSearch: CargosSearchGQL
  ) { }

  onGetAll(servidor = true): Observable<any> {
    return this.genericService.onGetAll(this.getAllCargos, null, null, servidor);
  }

  onSearch(texto, servidor = true): Observable<any> {
    return this.genericService.onGetByTexto(this.cargosSearch, texto, servidor);
  }
}
