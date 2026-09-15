import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../../../generics/generic-crud.service';
import { CapturaMuestraGQL } from './graphql/capturaMuestra';
import { CerrarCapturaMuestraGQL } from './graphql/cerrarCapturaMuestra';
import { CrearCapturaMuestraGQL } from './graphql/crearCapturaMuestra';
import { DerivarMapaDeMuestraGQL } from './graphql/derivarMapaDeMuestra';
import { GuardarRegionesDerivadasGQL } from './graphql/guardarRegionesDerivadas';
import { LectorDeCuponesDisponibleGQL } from './graphql/lectorDeCuponesDisponible';
import { MuestrasDeFormatoGQL } from './graphql/muestrasDeFormato';
import { RegionesDeFormatoGQL } from './graphql/regionesDeFormato';
import {
  CapturaMuestraQr,
  MuestraEstado,
  MuestraGuardada,
  RegionDerivada,
  RegionFormato,
  ResultadoDerivacion,
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
    private lectorGQL: LectorDeCuponesDisponibleGQL,
    private crearGQL: CrearCapturaMuestraGQL,
    private muestraGQL: CapturaMuestraGQL,
    private derivarGQL: DerivarMapaDeMuestraGQL,
    private cerrarGQL: CerrarCapturaMuestraGQL,
    private regionesGQL: RegionesDeFormatoGQL,
    private muestrasGQL: MuestrasDeFormatoGQL,
    private guardarGQL: GuardarRegionesDerivadasGQL
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
   * La URL absoluta de central para una ruta pública.
   *
   * Sale de la misma configuración con la que el desktop habla con central, que es el default
   * correcto: el teléfono debería llegar al mismo host. Si en producción esa dirección no fuera
   * alcanzable desde afuera, el servidor puede devolver una URL propia (`frc.captura-muestra.base-url`)
   * y esta función no se usa.
   *
   * **El fallback NO puede ser `localhost`.** Esta URL termina adentro de un QR que escanea un
   * teléfono: `localhost` ahí es el teléfono mismo, así que la página no abre nunca y no hay
   * ningún error que lo explique —se queda esperando una foto que jamás va a llegar—. Verificado
   * el 2026-09-15: el QR decía `http://localhost:8081/...`.
   *
   * Corriendo en el navegador (sin Electron) `window.environment` no existe, y ahí el mejor dato
   * disponible es el host por el que este navegador llegó a la app: si entró por
   * `192.168.0.106:4201`, el teléfono llega a `192.168.0.106:8081`. Abrir la app por `localhost`
   * sigue sin servir para el QR, y por eso el aviso de abajo lo dice en la pantalla en vez de
   * dejar que se descubra esperando.
   */
  urlCentral(ruta: string): string {
    const env: any = (window as any).environment ?? {};
    const ip = env.centralIp ?? window.location.hostname ?? 'localhost';
    const port = env.centralPort ?? '8081';
    return `http://${ip}:${port}${ruta}`;
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
