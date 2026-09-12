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
import { RegionesDeFormatoGQL } from './graphql/regionesDeFormato';
import {
  CapturaMuestraQr,
  MuestraEstado,
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
    confirmarSobrescritura = false
  ): Observable<ResultadoDerivacion> {
    // Sólo las que se pudieron derivar. Una región sin coordenadas ni etiqueta no ancla a nada y
    // el backend la rechaza con razón: el campo se resuelve por patrón igual.
    const utiles = (regiones ?? [])
      .filter((r) => !r.sinRegion)
      .map((r, i) => ({
        campo: r.campo,
        etiqueta: r.etiqueta,
        posicion: r.posicion,
        x1: r.x1,
        y1: r.y1,
        x2: r.x2,
        y2: r.y2,
        orden: i,
      }));

    return this.genericService.onCustomMutation(
      this.guardarGQL,
      { formatoTerminalPosId, regiones: utiles, confirmarSobrescritura },
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
   */
  urlCentral(ruta: string): string {
    const env: any = (window as any).environment ?? {};
    const ip = env.centralIp ?? 'localhost';
    const port = env.centralPort ?? '8081';
    return `http://${ip}:${port}${ruta}`;
  }
}
