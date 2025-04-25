import { Injectable } from '@angular/core';
import { ApolloBase } from 'apollo-angular';
import { Observable } from 'rxjs';
import { GenericCrudService, QueryError } from './../../../generics/generic-crud.service';
import { Cliente, ClienteInput, TipoCliente } from './cliente.model';
import { ClienteByIdGQL } from './graphql/clienteById';
import { ClientePersonaDocumentoGQL } from './graphql/clientePorPersonaDocumento';
import { ClientePersonaIdFromServerGQL } from './graphql/clientePorPersonaIdFromServer';
import { ClientesSearchByPersonaGQL } from './graphql/clienteSearchByPersona';
import { ClientesSearchByPersonaIdGQL } from './graphql/clienteSearchByPersonaId';
import { ClientesSearchConFiltrosGQL } from './graphql/clienteWithFilters';
import { SaveClienteGQL } from './graphql/saveCliente';
import { PageInfo } from '../../../app.component';
import { ConsultaRucGQL } from './graphql/consultaRuc';
import { RucResponse } from '../../../shared/services/ruc.service';
import { NotificacionColor } from '../../../notificacion-snackbar.service';

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
    private saveCliente: SaveClienteGQL,
    private consultaRuc: ConsultaRucGQL
  ) {
  }

  onSaveCliente(input: ClienteInput, servidor: boolean = true): Observable<Cliente> {
    let errorConf: QueryError = {
      networkError: {
        show: false,
        propagate: true
      }
    }
    return this.genericService.onSave(this.saveCliente, input, null, null, servidor, errorConf);
  }

  onGetClientePorPersonaDocumento(texto: string, servidor: boolean = true): Observable<Cliente> {
    return this.genericService.onGetByTexto(this.getClientePorPersonaDocumento, texto, servidor);
  }

  onGetById(id: number, servidor: boolean = true): Observable<Cliente> {
    return this.genericService.onGetById(this.getClienteById, id, null, null, servidor);
  }

  onGetByIdFromServer(id: number, servidor: boolean = true): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaIdFromServer, id, null, null, servidor);
  }

  onGetByPersonaId(id: number, servidor: boolean = true): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaId, id, null, null, servidor);
  }

  onSearch(texto: string, servidor: boolean = true): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto, servidor);
  }

  onSearchConFiltros(texto: string, tipo: TipoCliente, page, size, servidor: boolean = true): Observable<PageInfo<Cliente>> {
    return this.genericService.onCustomQuery(this.searchWithFilters, { texto, tipo, page, size }, servidor);
  }

  onGetByPersonaIdFromServer(id: number): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaId, id, null, null, true, null, false, 10000);
  }

  onSearchFromServer(texto: string): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto, true, 10000);
  }

  onConsultaRuc(ruc:string, servidor: boolean = true): Observable<RucResponse>{
    let errorConf: QueryError = {
      networkError: {
        show: false,
        propagate: true
      }
    }
    return this.genericService.onCustomQuery(this.consultaRuc, {ruc}, servidor, errorConf)
  }

}
