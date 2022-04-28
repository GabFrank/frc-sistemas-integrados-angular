import { ClientesSearchByPersonaGQL } from './graphql/clienteSearchByPersona';
import { Observable } from 'rxjs';
import { ClienteByIdGQL } from './graphql/clienteById';
import { GenericCrudService } from './../../../generics/generic-crud.service';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  constructor(private genericService: GenericCrudService, private getClienteById: ClienteByIdGQL, public searchByPersonaNombre: ClientesSearchByPersonaGQL) { }

  onGetById(id:number): Observable<any>
  {
    return this.genericService.onGetById(this.getClienteById, id);
  }

  onSearch(texto:string): Observable<any>{
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto);
  }


}
