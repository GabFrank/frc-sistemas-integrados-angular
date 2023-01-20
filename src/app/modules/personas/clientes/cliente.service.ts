import { Injectable } from '@angular/core';
import { ApolloBase } from 'apollo-angular';
import { Observable } from 'rxjs';
import { GenericCrudService } from './../../../generics/generic-crud.service';
import { Cliente } from './cliente.model';
import { ClienteByIdGQL } from './graphql/clienteById';
import { ClientePersonaDocumentoGQL } from './graphql/clientePorPersonaDocumento';
import { ClientePersonaIdFromServerGQL } from './graphql/clientePorPersonaIdFromServer';
import { ClientesSearchByPersonaGQL } from './graphql/clienteSearchByPersona';
import { ClientesSearchByPersonaIdGQL } from './graphql/clienteSearchByPersonaId';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private apollo: ApolloBase;

  constructor(
    private genericService: GenericCrudService,
    private getClienteById: ClienteByIdGQL,
    public searchByPersonaNombre: ClientesSearchByPersonaGQL,
    private getClientePorPersonaDocumento: ClientePersonaDocumentoGQL,
    private getClientePorPersonaId: ClientesSearchByPersonaIdGQL,
    private getClientePorPersonaIdFromServer: ClientePersonaIdFromServerGQL,
  ) {
  }

  onGetClientePorPersonaDocumento(texto: string): Observable<Cliente> {
    return this.genericService.onGetByTexto(this.getClientePorPersonaDocumento, texto)
  }

  onGetById(id: number): Observable<Cliente[]> {
    return this.genericService.onGetById(this.getClienteById, id);
  }

  onGetByIdFromServer(id: number): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaIdFromServer, id);
  }

  onGetByPersonaId(id: number): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaId, id);
  }

  onSearch(texto: string): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto);
  }

  onGetByPersonaIdFromServer(id: number): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaId, id, null, null, true, null, false);
  }

  onSearchFromServer(texto: string): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto, true);
  }


}
