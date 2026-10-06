import { Injectable } from '@angular/core';
import { ApolloBase } from 'apollo-angular';
import { Observable } from 'rxjs';
import { GenericCrudService, QueryError } from './../../../generics/generic-crud.service';
import { Cliente, ClienteInput, TipoCliente } from './cliente.model';
import { ClienteByIdGQL } from './graphql/clienteById';
import { ClientePersonaDocumentoGQL } from './graphql/clientePorPersonaDocumento';
import { ClientePorPersonaDocumentoDetalladoGQL } from './graphql/clientePorPersonaDocumentoDetallado';
import { ClientePersonaIdFromServerGQL } from './graphql/clientePorPersonaIdFromServer';
import { ClientesSearchByPersonaGQL } from './graphql/clienteSearchByPersona';
import { ClientesSearchByPersonaIdGQL } from './graphql/clienteSearchByPersonaId';
import { ClientesSearchConFiltrosGQL } from './graphql/clienteWithFilters';
import { SaveClienteGQL } from './graphql/saveCliente';
import { PageInfo } from '../../../app.component';
import { ConsultaRucGQL } from './graphql/consultaRuc';
import { RucResponse } from '../../../shared/services/ruc.service';
import { NotificacionColor } from '../../../notificacion-snackbar.service';
import { ClienteResponse } from './cliente.model';

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
    private getClientePorPersonaDocumentoDetallado: ClientePorPersonaDocumentoDetalladoGQL,
    private getClientePorPersonaId: ClientesSearchByPersonaIdGQL,
    private getClientePorPersonaIdFromServer: ClientePersonaIdFromServerGQL,
    private searchWithFilters: ClientesSearchConFiltrosGQL,
    private saveCliente: SaveClienteGQL,
    private consultaRuc: ConsultaRucGQL
  ) {
  }

  onSaveCliente(input: ClienteInput, servidor: boolean = true): Observable<Cliente> {
    // Sin `show: false`: su único llamador no avisa nada, así que el aviso lo da el genérico (#390).
    let errorConf: QueryError = {
      networkError: {
        propagate: true
      }
    }
    return this.genericService.onSave(this.saveCliente, input, null, null, servidor, errorConf);
  }

  onGetClientePorPersonaDocumento(texto: string, servidor: boolean = true): Observable<Cliente> {
    let errorConf: QueryError = {
      graphError: {
        show: false,
        propagate: true
      },
      networkError: {
        show: false,
        propagate: true
      }
    };
    return this.genericService.onGetByTexto(this.getClientePorPersonaDocumento, texto, servidor, null, errorConf);
  }

  onGetClientePorPersonaDocumentoDetallado(texto: string, servidor: boolean = true): Observable<ClienteResponse> {
    let errorConf: QueryError = {
      graphError: {
        show: false,
        propagate: true
      },
      networkError: {
        show: false,
        propagate: true
      }
    };
    return this.genericService.onCustomQuery(this.getClientePorPersonaDocumentoDetallado, { texto }, servidor, errorConf);
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

  onSearch(texto: string, servidor: boolean = true, errorConf?: QueryError): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto, servidor, undefined, errorConf);
  }

  onSearchConFiltros(texto: string, tipo: TipoCliente, page, size, servidor: boolean = true): Observable<PageInfo<Cliente>> {
    return this.genericService.onCustomQuery(this.searchWithFilters, { texto, tipo, page, size }, servidor);
  }

  /** Sin `errorConf` no emite nada si falla (el llamador queda con lo que tenía): pasarlo para enterarse (#390). */
  onGetByPersonaIdFromServer(id: number, errorConf?: QueryError): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaId, id, null, null, true, null, false, 10000, null, 
      "Ocurrio un error al obtener el cliente. Verifique si possee conexión a internet", 
      "Ocurrio un error al obtener el cliente. Verifique si possee conexión a internet", errorConf);
  }

  onSearchFromServer(texto: string, errorConf?: QueryError): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto, true, 10000, errorConf);
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
