import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';
import { ConfiguracionService } from '../../../../../shared/services/configuracion.service';
import { urlsDeServidor } from '../../../../../commons/core/utils/webEndpoints';
import { CapturaMuestraGQL } from './graphql/capturaMuestra';
import { CerrarCapturaMuestraGQL } from './graphql/cerrarCapturaMuestra';
import { CrearCapturaMuestraGQL } from './graphql/crearCapturaMuestra';
import { DerivarMapaDeMuestraGQL } from './graphql/derivarMapaDeMuestra';
import { GuardarRegionesDerivadasGQL } from './graphql/guardarRegionesDerivadas';
import { LectorDeCuponesDisponibleGQL } from './graphql/lectorDeCuponesDisponible';
import { DeleteRegionTerminalPosGQL } from './graphql/deleteRegionTerminalPos';
import { EliminarMuestraGQL } from './graphql/eliminarMuestra';
import { SaveRegionTerminalPosGQL } from './graphql/saveRegionTerminalPos';
import { MuestrasDeFormatoGQL } from './graphql/muestrasDeFormato';
import { ProbarFormatoGQL } from './graphql/probarFormato';
import { RegionesDeFormatoGQL } from './graphql/regionesDeFormato';
import {
  CapturaMuestraQr,
  MuestraEstado,
  MuestraGuardada,
  RegionDerivada,
  RegionFormato,
  ResultadoDerivacion,
  ResultadoPruebaFormato,
} from './mapa-formato.model';

/**
 * El mapa de un formato, de punta a punta contra el **central**.
 *
 * Desde esta entrega el ciclo entero vive ahí: la captura de muestra, el motor OCR que la lee, la
 * derivación y la persistencia. No pasa por ningún filial —y no podría: la venta con tarjeta se
 * bloquea cuando la terminal no tiene formato, así que antes de configurarlo no hay capturas de
 * ese ticket.
 */
@Injectable({ providedIn: 'root' })
export class MapaFormatoService {

  constructor(
    private genericService: GenericCrudService,
    private http: HttpClient,
    private configService: ConfiguracionService,
    private lectorGQL: LectorDeCuponesDisponibleGQL,
    private crearGQL: CrearCapturaMuestraGQL,
    private muestraGQL: CapturaMuestraGQL,
    private derivarGQL: DerivarMapaDeMuestraGQL,
    private cerrarGQL: CerrarCapturaMuestraGQL,
    private regionesGQL: RegionesDeFormatoGQL,
    private muestrasGQL: MuestrasDeFormatoGQL,
    private eliminarMuestraGQL: EliminarMuestraGQL,
    private saveRegionGQL: SaveRegionTerminalPosGQL,
    private deleteRegionGQL: DeleteRegionTerminalPosGQL,
    private guardarGQL: GuardarRegionesDerivadasGQL,
    private probarGQL: ProbarFormatoGQL
  ) {}

  onLectorDisponible(): Observable<boolean> {
    return this.genericService.onCustomQuery(this.lectorGQL, null, true, null, true);
  }

  onCrearMuestra(formatoTerminalPosId: number): Observable<CapturaMuestraQr> {
    return this.genericService.onCustomMutation(this.crearGQL, { formatoTerminalPosId }, true);
  }

  /** `silentLoad`: esto se sondea de fondo y no puede parpadear un "Cargando" sobre el QR. */
  onEstadoMuestra(token: string): Observable<MuestraEstado> {
    return this.genericService.onCustomQuery(this.muestraGQL, { token }, true, null, true);
  }

  onDerivar(token: string, formatoTerminalPosId: number): Observable<RegionDerivada[]> {
    return this.genericService
      .onCustomMutation(this.derivarGQL, { token, formatoTerminalPosId }, true)
      .pipe(map((r) => (r ?? []) as RegionDerivada[]));
  }

  /**
   * Pasa un cupón real por el formato **guardado** y dice si lo lee bien.
   *
   * Corre contra lo persistido a propósito: es lo que las 24 filiales van a recibir. Quien llama
   * se encarga de guardar antes, para que lo que se prueba y lo que se despliega sean lo mismo.
   */
  onProbarFormato(
    formatoTerminalPosId: number,
    origen: { token?: string; texto?: string }
  ): Observable<ResultadoPruebaFormato> {
    return this.genericService.onCustomQuery(
      this.probarGQL,
      {
        formatoTerminalPosId,
        token: origen?.token ?? null,
        texto: origen?.texto ?? null,
      },
      // Contra CENTRAL, como todo el ciclo del formato.
      true,
      // ⚠️ `propagate: true` NO es opcional acá. Sin él, `onCustomQuery` se traga el error de red y
      // NO emite ni `next` ni `error` --verificado en generic-crud.service.ts:170-185-- así que el
      // panel se queda en "Probando…" para siempre, sin spinner que termine ni mensaje que leer.
      { networkError: { propagate: true } }
    );
  }

  onCerrarMuestra(token: string): Observable<boolean> {
    return this.genericService.onCustomMutation(this.cerrarGQL, { token }, true);
  }

  /** Las fotos de cupón con las que se configuró este formato, la más nueva primero. */
  onGetMuestras(formatoTerminalPosId: number): Observable<MuestraGuardada[]> {
    return this.genericService
      .onCustomQuery(this.muestrasGQL, { formatoTerminalPosId }, true, null, true)
      .pipe(map((r) => (r ?? []) as MuestraGuardada[]));
  }

  /**
   * La foto de una muestra, como blob.
   *
   * No se puede poner la URL directo en un `<img src>`: el endpoint va autenticado --son cupones
   * reales, con importe, boleta y serie de terminal-- y una etiqueta `img` no manda el token. Se
   * baja con el header y se convierte en object URL. Quien la use tiene que revocarla al
   * descartarla, si no cada foto mirada queda ocupando memoria hasta recargar la app.
   */
  onGetImagenMuestra(id: number): Observable<Blob> {
    const token = localStorage.getItem('token_central') || localStorage.getItem('token') || '';
    return this.http.get(this.urlCentral(`/api/captura-muestra/imagen/${id}`), {
      headers: { Authorization: `Token ${token}` },
      responseType: 'blob',
    });
  }

  /** Borra una muestra guardada con su foto. */
  onEliminarMuestra(id: number): Observable<boolean> {
    return this.genericService.onCustomMutation(this.eliminarMuestraGQL, { id }, true);
  }

  /**
   * Guarda una región dibujada a mano.
   *
   * El backend le fuerza `origen = MANUAL`, y la derivación no pisa una MANUAL ni con la
   * confirmación: lo corregido a mano sobrevive a las derivaciones que vengan.
   */
  onGuardarRegion(region: RegionFormato): Observable<RegionFormato> {
    return this.genericService.onCustomMutation(this.saveRegionGQL, { region }, true);
  }

  onBorrarRegion(id: number): Observable<boolean> {
    return this.genericService.onCustomMutation(this.deleteRegionGQL, { id }, true);
  }

  onGetRegiones(formatoTerminalPosId: number): Observable<RegionFormato[]> {
    return this.genericService
      .onCustomQuery(this.regionesGQL, { formatoTerminalPosId }, true, null, true)
      .pipe(map((r) => (r ?? []) as RegionFormato[]));
  }

  /**
   * Guarda el mapa derivado.
   *
   * `confirmarSobrescritura` sólo hace falta cuando el formato ya tiene mapa. Sin él, el backend
   * devuelve `aplicado: false` con el diff en vez de pisar.
   */
  onGuardarDerivadas(
    formatoTerminalPosId: number,
    regiones: RegionDerivada[],
    confirmarSobrescritura = false,
    // Por defecto la derivación ACUMULA: una segunda foto ensancha la caja en vez de pisarla,
    // porque un mismo modelo imprime más de un layout. `desdeCero` descarta lo acumulado.
    desdeCero = false
  ): Observable<ResultadoDerivacion> {
    // Sólo las que se pudieron derivar. Una región sin coordenadas ni etiqueta no ancla a nada y
    // el backend la rechaza con razón: el campo se resuelve por patrón igual.
    const utiles = (regiones ?? [])
      .filter((r) => !r.sinRegion)
      .map((r, i) => ({
        campo: r.campo,
        etiqueta: r.etiqueta,
        posicion: r.posicion,
        // Lo declara el mapeo del formato y el backend lo adjunta al derivar. Si no viaja acá, la
        // columna nace nula y el filial no tiene con qué comparar el valor leído.
        tipo: r.tipo,
        x1: r.x1,
        y1: r.y1,
        x2: r.x2,
        y2: r.y2,
        orden: i,
      }));

    return this.genericService.onCustomMutation(
      this.guardarGQL,
      { formatoTerminalPosId, regiones: utiles, confirmarSobrescritura, desdeCero },
      true
    );
  }

  /**
   * Sube la foto del cupón de muestra directo desde el ABM.
   *
   * <b>Es el camino que no depende de la red.</b> El QR sirve cuando el teléfono puede alcanzar a
   * central —en producción sí, en alpha puede que no, porque vive sin IP pública— y esto siempre,
   * porque va por la misma conexión que el navegador ya tiene con central.
   *
   * Va por REST y no por GraphQL a propósito: del otro lado hay un endpoint que recibe el JPEG
   * crudo, el mismo que usa el teléfono. No vale la pena duplicarlo en base64 dentro de una
   * mutation.
   */
  onSubirFoto(ruta: string, archivo: File): Observable<any> {
    return this.http.post(this.urlCentral(ruta), archivo, {
      headers: { 'Content-Type': 'image/jpeg' },
      responseType: 'json',
    });
  }

  /**
   * La URL absoluta de central para una ruta pública: el QR, «Subir una foto» y la foto de una
   * muestra.
   *
   * Sale de la misma configuración con la que Apollo habla con central (`ConfiguracionService`) y
   * se arma con `urlsDeServidor`, igual que el resto del desktop. El teléfono debería llegar al
   * mismo host. Si en producción esa dirección no fuera alcanzable desde afuera, el servidor puede
   * devolver una URL propia (`frc.captura-muestra.base-url`) y el QR usa esa.
   *
   * ⚠️ Antes leía `window.environment.centralIp`, que no lo llena nadie (el `config.service.ts` que
   * lo escribía no se inyecta en ningún lado), y caía siempre al host de la página con el puerto
   * `8081` fijo. Medido el 2026-09-24 en farmacia: la app instalada armaba `http://:8081/...`
   * —Electron no tiene hostname y `??` no reemplaza el texto vacío— y la web
   * `http://farmacia.desk.frcsuite.com:8081/...`, el sitio estático, sin backend. Y `8081` es el
   * central de bodega. Ni el QR ni las subidas funcionaban en ninguno de los dos.
   * Ahora: web → `https://farmacia-api.frcsuite.com/...` (override por host); app instalada →
   * `http://<ip central>:<puerto central>/...` de la configuración.
   *
   * **El fallback NO puede ser `localhost`.** Esta URL termina adentro de un QR que escanea un
   * teléfono: `localhost` ahí es el teléfono mismo, así que la página no abre nunca y no hay
   * ningún error que lo explique. Verificado el 2026-09-15: el QR decía `http://localhost:8081/...`.
   * Sin configuración (sólo pasa en `ng serve`) el mejor dato es el host por el que este navegador
   * llegó a la app: si entró por `192.168.0.106:4201`, el teléfono llega a `192.168.0.106:8081`.
   * Abrir la app por `localhost` sigue sin servir para el QR, y `qrEsAlcanzable` lo dice en
   * pantalla en vez de dejar que se descubra esperando.
   */
  urlCentral(ruta: string): string {
    const config = this.configService.getConfig();
    // `||` y no `??`: el hostname de Electron es '' y tiene que caer al siguiente.
    const ip = config?.serverCentralIp || window.location.hostname || 'localhost';
    const port = config?.serverCentralPort || '8081';
    return `${urlsDeServidor(ip, port).http}${ruta}`;
  }

  /**
   * Si la URL del QR es alcanzable desde un teléfono.
   *
   * `localhost` y `127.0.0.1` apuntan al aparato que escanea, no a central.
   */
  qrEsAlcanzable(url: string): boolean {
    if (!url) return true;
    return !/^https?:\/\/(localhost|127\.0\.0\.1)[:/]/i.test(url);
  }
}
