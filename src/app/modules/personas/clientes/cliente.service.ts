import { ClientesSearchByPersonaGQL } from './graphql/clienteSearchByPersona';
import { Observable } from 'rxjs';
import { ClienteByIdGQL } from './graphql/clienteById';
import { GenericCrudService } from './../../../generics/generic-crud.service';
import { Injectable } from '@angular/core';
import { ClientePersonaDocumentoGQL } from './graphql/clientePorPersonaDocumento';
import { Cliente } from './cliente.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  constructor(
    private genericService: GenericCrudService,
    private getClienteById: ClienteByIdGQL,
    public searchByPersonaNombre: ClientesSearchByPersonaGQL,
    private getClientePorPersonaDocumento: ClientePersonaDocumentoGQL
  ) { }

  onGetClientePorPersonaDocumento(texto:string): Observable<Cliente>{
    return this.genericService.onGetByTexto(this.getClientePorPersonaDocumento, texto)
  }

  onGetById(id: number): Observable<Cliente[]> {
    return this.genericService.onGetById(this.getClienteById, id);
  }

  onSearch(texto: string): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto);
  }


}
