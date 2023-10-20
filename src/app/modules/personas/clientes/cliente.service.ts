import { Injectable } from '@angular/core';
import { ApolloBase } from 'apollo-angular';
import { Observable } from 'rxjs';
import { GenericCrudService } from './../../../generics/generic-crud.service';
import { Cliente, ClienteInput, TipoCliente } from './cliente.model';
import { ClienteByIdGQL } from './graphql/clienteById';
import { ClientePersonaDocumentoGQL } from './graphql/clientePorPersonaDocumento';
import { ClientePersonaIdFromServerGQL } from './graphql/clientePorPersonaIdFromServer';
import { ClientesSearchByPersonaGQL } from './graphql/clienteSearchByPersona';
import { ClientesSearchByPersonaIdGQL } from './graphql/clienteSearchByPersonaId';
import { ClientesSearchConFiltrosGQL } from './graphql/clienteWithFilters';
import { SaveClienteGQL } from './graphql/saveCliente';

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
    private searchWithFilters: ClientesSearchConFiltrosGQL,
    private saveCliente: SaveClienteGQL
  ) {
  }

  onSaveCliente(input: ClienteInput): Observable<Cliente> {
    return this.genericService.onSave(this.saveCliente, input, null, null, true);
  }

  onGetClientePorPersonaDocumento(texto: string): Observable<Cliente> {
    return this.genericService.onGetByTexto(this.getClientePorPersonaDocumento, texto)
  }

  onGetById(id: number): Observable<Cliente> {
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

  onSearchConFiltros(texto: string, tipo: TipoCliente, page, size): Observable<Cliente[]> {
    return this.genericService.onCustomQuery(this.searchWithFilters, { texto, tipo, page, size }, false);
  }

  onGetByPersonaIdFromServer(id: number): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaId, id, null, null, true, null, false, 10000);
  }

  onSearchFromServer(texto: string): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto, true, 10000);
  }

}
