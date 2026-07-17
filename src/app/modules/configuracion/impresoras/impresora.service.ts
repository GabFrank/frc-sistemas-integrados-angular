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
import { ImprimirPruebaEnImpresoraGQL } from './graphql/imprimirPruebaEnImpresora';

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
    private dispositivosParaInstalarGQL: DispositivosParaInstalarGQL,
    private instalarImpresoraCupsGQL: InstalarImpresoraCupsGQL,
    private imprimirPruebaEnImpresoraGQL: ImprimirPruebaEnImpresoraGQL,
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
   * Imprime un ticket de prueba generado server-side y lo rutea al host dueño de la impresora
   * (`PrintRouterService`, ya existente): si la impresora es de una filial, el central hace proxy
   * automático a esa filial por `Sucursal.ip`/`puertoServidor`. Se usa como respaldo de "Probar"
   * cuando la impresión local (Electron) falla porque la cola no existe en esta PC — el caso típico
   * es una impresora agregada desde "Agregar desde sucursal", que vive en otro host.
   */
  probarEnBackend(impresoraId: number, servidor = true): Observable<boolean> {
    return this.genericService.onCustomMutation(
      this.imprimirPruebaEnImpresoraGQL,
      { impresoraId },
      servidor
    );
  }

  /**
   * Instala una cola CUPS en un servidor apuntado por IP (no la config de Apollo). Manda la
   * mutation por HTTP directo a http://<servidorIp>:<servidorPort>/graphql con el token del
   * servidor destino. Se usa al COMPARTIR la impresora local: el servidor (central o filial)
   * instala una cola que apunta a la URI IPP de esta PC.
   *
   * El token depende del destino (mismo criterio que graphql-connection.service):
   *   - central → token_central (fallback token)
   *   - filial  → token (el login local/filial)
   * Así se autentica bien según a qué servidor se comparte.
   */
  instalarEnServidorPorIp(
    nombreCola: string,
    uri: string,
    raw: boolean,
    servidorIp: string,
    servidorPort: string | number,
    esCentral: boolean,
  ): Observable<boolean> {
    const url = `http://${servidorIp}:${servidorPort}/graphql`;
    const token = (esCentral
      ? localStorage.getItem('token_central') || localStorage.getItem('token')
      : localStorage.getItem('token')) || '';
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
          throw new Error(res.errors[0]?.message || 'Error GraphQL en el servidor');
        }
        return res?.data?.instalarImpresoraCups === true;
      }),
    );
  }

  /**
   * Lista las colas CUPS ya instaladas en una SUCURSAL elegida, consultando directo por IP (no los
   * dos Apollo clients fijos de central/local). Se usa para "Agregar desde sucursal": el backend
   * filial de esa sucursal ya expone `impresorasDelSistema` con el mismo login del usuario (sin
   * credenciales de sistema operativo, sin instalar nada). El puerto lo escribe el usuario porque
   * puede variar entre sucursales.
   */
  delSistemaEnServidorPorIp(sucursalIp: string, sucursalPort: string | number): Observable<string[]> {
    const url = `http://${sucursalIp}:${sucursalPort}/graphql`;
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    });
    const body = {
      query: 'query { data: impresorasDelSistema }',
    };
    return this.http.post<any>(url, body, { headers }).pipe(
      map((res) => {
        if (res?.errors?.length) {
          throw new Error(res.errors[0]?.message || 'Error GraphQL en la sucursal');
        }
        return res?.data?.data ?? [];
      }),
    );
  }

  /**
   * Habilita el compartir CUPS (por red, via IPP) de una cola ya instalada en una SUCURSAL, para
   * que otro host (típicamente el central) pueda instalar una cola proxy que reenvíe hacia ella.
   * Se usa desde "Agregar desde sucursal": la sucursal ya tiene la cola instalada localmente, pero
   * no expuesta por red hasta que se llama esta mutation en SU PROPIO backend (por IP). Reutiliza
   * el login actual, igual que {@link delSistemaEnServidorPorIp}.
   */
  compartirColaEnServidorPorIp(
    nombreCola: string,
    sucursalIp: string,
    sucursalPort: string | number,
    ipDestino: string,
  ): Observable<boolean> {
    const url = `http://${sucursalIp}:${sucursalPort}/graphql`;
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    });
    const body = {
      query:
        'mutation($nombreCola: String!, $ipDestino: String) { '
        + 'compartirColaCups(nombreCola: $nombreCola, ipDestino: $ipDestino) }',
      variables: { nombreCola, ipDestino },
    };
    return this.http.post<any>(url, body, { headers }).pipe(
      map((res) => {
        if (res?.errors?.length) {
          throw new Error(res.errors[0]?.message || 'Error GraphQL en la sucursal');
        }
        return res?.data?.compartirColaCups === true;
      }),
    );
  }
}
