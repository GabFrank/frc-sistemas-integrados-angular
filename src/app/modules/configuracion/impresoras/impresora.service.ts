import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { DispositivoDetectado, Impresora, ImpresoraInput } from './impresora.model';
import { DispositivosParaInstalarGQL } from './graphql/dispositivosParaInstalar';
import { InstalarImpresoraCupsGQL } from './graphql/instalarImpresoraCups';
import { ImpresorasGQL } from './graphql/impresorasQuery';
import { ImpresoraSearchPageGQL, ImpresoraPageResponse } from './graphql/impresoraSearchPage.query';
import { ImpresoraByIdGQL } from './graphql/impresoraById';
import { SaveImpresoraGQL } from './graphql/saveImpresora';
import { DeleteImpresoraGQL } from './graphql/deleteImpresora';
import { ImpresorasDelSistemaGQL } from './graphql/impresorasDelSistema';
import { ImprimirPruebaGQL } from './graphql/imprimirPrueba';

@Injectable({
  providedIn: 'root'
})
export class ImpresoraService {

  constructor(
    private genericService: GenericCrudService,
    private http: HttpClient,
    private impresorasGQL: ImpresorasGQL,
    private impresoraSearchPageGQL: ImpresoraSearchPageGQL,
    private impresoraByIdGQL: ImpresoraByIdGQL,
    private saveImpresoraGQL: SaveImpresoraGQL,
    private deleteImpresoraGQL: DeleteImpresoraGQL,
    private impresorasDelSistemaGQL: ImpresorasDelSistemaGQL,
    private imprimirPruebaGQL: ImprimirPruebaGQL,
    private dispositivosParaInstalarGQL: DispositivosParaInstalarGQL,
    private instalarImpresoraCupsGQL: InstalarImpresoraCupsGQL,
  ) { }

  /** Registro de impresoras. Vive en el servidor central (administrativo). */
  todas(page?: number, size?: number): Observable<Impresora[]> {
    return this.genericService.onGetAll(this.impresorasGQL, page, size, true);
  }

  buscarConPagina(texto: string, page: number, size: number, servidor = true): Observable<ImpresoraPageResponse['data']> {
    return this.impresoraSearchPageGQL
      .fetch({ texto, page, size }, { fetchPolicy: 'network-only' })
      .pipe(map((res) => res.data.data));
  }

  porId(id: number): Observable<Impresora> {
    return this.genericService.onGetById(this.impresoraByIdGQL, id);
  }

  guardar(input: ImpresoraInput, servidor = true): Observable<Impresora> {
    return this.genericService.onSave(this.saveImpresoraGQL, input, null, null, servidor);
  }

  eliminar(id: number, servidor = true): Observable<boolean> {
    return this.genericService.onDelete(
      this.deleteImpresoraGQL,
      id,
      '¿Eliminar impresora?',
      null,
      true,
      servidor,
      '¿Está seguro que desea eliminar esta impresora?'
    );
  }

  /**
   * Colas de impresion del host consultado (CUPS). servidor=true consulta el central;
   * servidor=false consulta el servidor local/filial. Sirve para descubrir impresoras
   * al dar de alta.
   */
  delSistema(servidor = false): Observable<string[]> {
    return this.genericService.onGetAll(this.impresorasDelSistemaGQL, null, null, servidor);
  }

  /**
   * Imprime un ticket de prueba en la impresora. Se envía al servidor central, que
   * rutea al host dueño (local o filial) según la sucursal de la impresora.
   */
  probar(id: number, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(this.imprimirPruebaGQL, { impresoraId: id }, servidor);
  }

  /**
   * Dispositivos conectados (USB/red/serial) que todavía no tienen cola CUPS creada.
   * Corre en el host del backend consultado (servidor=false → filial local, donde está
   * físicamente la impresora).
   */
  dispositivos(servidor = false): Observable<DispositivoDetectado[]> {
    return this.genericService.onGetAll(this.dispositivosParaInstalarGQL, null, null, servidor);
  }

  /** Instala una cola CUPS (raw por defecto = térmica ESC/POS) en el host del backend. */
  instalar(nombreCola: string, uri: string, raw = true, servidor = false): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.instalarImpresoraCupsGQL,
      { nombreCola, uri, raw },
      servidor
    );
  }

  /**
   * Instala una cola CUPS en el servidor central apuntado por IP (no la config de Apollo).
   * Manda la mutation por HTTP directo a http://<centralIp>:<centralPort>/graphql con el token.
   * Permite elegir a qué central instalar (ej. el central real 172.25.1.200) desde el desktop.
   */
  instalarEnCentralPorIp(
    nombreCola: string,
    uri: string,
    raw: boolean,
    centralIp: string,
    centralPort: string | number,
  ): Observable<boolean> {
    const url = `http://${centralIp}:${centralPort}/graphql`;
    const token = localStorage.getItem('token_central') || localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    });
    const body = {
      query:
        'mutation($nombreCola: String!, $uri: String!, $raw: Boolean) { '
        + 'instalarImpresoraCups(nombreCola: $nombreCola, uri: $uri, raw: $raw) }',
      variables: { nombreCola, uri, raw },
    };
    return this.http.post<any>(url, body, { headers }).pipe(
      map((res) => {
        // Si el central respondió con errores GraphQL (ej. versión vieja sin la mutation, o
        // sin permisos) los propagamos para mostrar el motivo real, no un "false" opaco.
        if (res?.errors?.length) {
          throw new Error(res.errors[0]?.message || 'Error GraphQL en el central');
        }
        return res?.data?.instalarImpresoraCups === true;
      }),
    );
  }
}
