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

  onSaveCliente(input: ClienteInput): Observable<Cliente> {
    let errorConf: QueryError = {
      networkError: {
        show: false,
        propagate: true
      }
    }
    return this.genericService.onSave(this.saveCliente, input, null, null, true, errorConf);
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

  onSearchConFiltros(texto: string, tipo: TipoCliente, page, size): Observable<PageInfo<Cliente>> {
    return this.genericService.onCustomQuery(this.searchWithFilters, { texto, tipo, page, size }, false);
  }

  onGetByPersonaIdFromServer(id: number): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaId, id, null, null, true, null, false, 10000);
  }

  onSearchFromServer(texto: string): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto, true, 10000);
  }

  onConsultaRuc(ruc:string): Observable<RucResponse>{
    let errorConf: QueryError = {
      networkError: {
        show: false,
        propagate: true
      }
    }
    return this.genericService.onCustomQuery(this.consultaRuc, {ruc}, errorConf)
  }

}
