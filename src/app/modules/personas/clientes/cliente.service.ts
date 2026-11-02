import { Injectable } from '@angular/core';
import { ApolloBase } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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

  /** `opciones.avisarExito = false` en un paso intermedio: el verde lo da el último paso o la pantalla (#501). */
  onSaveCliente(input: ClienteInput, servidor: boolean = true, opciones?: { avisarExito?: boolean }): Observable<Cliente> {
    // `show: false`: su único llamador (alta de cliente) da su propio aviso, que dice qué quedó guardado.
    let errorConf: QueryError = {
      networkError: {
        propagate: true,
        show: false
      }
    }
    return this.genericService.onSave(this.saveCliente, input, null, null, servidor, errorConf, undefined, opciones);
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

  /** Sin `errorConf` un error falla hacia quien llama (#390). */
  onGetByPersonaIdFromServer(id: number, errorConf?: QueryError): Observable<Cliente> {
    return this.genericService.onGetById(this.getClientePorPersonaId, id, null, null, true, null, false, 10000, null, 
      "Ocurrio un error al obtener el cliente. Verifique si possee conexión a internet", 
      "Ocurrio un error al obtener el cliente. Verifique si possee conexión a internet", errorConf);
  }

  onSearchFromServer(texto: string, errorConf?: QueryError): Observable<Cliente[]> {
    return this.genericService.onGetByTexto(this.searchByPersonaNombre, texto, true, 10000, errorConf);
  }

  /**
   * Clientes cuyo nombre o documento contiene `texto`, para sugerir mientras se escribe: sin
   * diálogo de carga (le robaría el foco al campo) y sin snackbar si falla.
   */
  onSugerir(texto: string, cantidad: number = 8, servidor: boolean = true): Observable<Cliente[]> {
    const errorConf: QueryError = {
      graphError: { show: false, propagate: true },
      networkError: { show: false, propagate: true },
    };
    return this.genericService
      .onCustomQuery(this.searchWithFilters, { texto, tipo: null, page: 0, size: cantidad }, servidor, errorConf, true)
      .pipe(map((pagina: PageInfo<Cliente>) => pagina?.getContent ?? []));
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
