import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { urlsDeServidor } from '../../commons/core/utils/webEndpoints';
import { ConfiguracionService } from '../../shared/services/configuracion.service';
import {
  CaptchaRecuperacion,
  EstadoRecuperacion,
  SolicitudRrhhCreada,
  VerificacionRecuperacion,
} from './recuperacion-contrasena.model';

/**
 * "¿Olvidó su contraseña?". Va siempre al central: es el que tiene el correo configurado, y la
 * contraseña nueva baja a las filiales por replicación. Toda la regla (captcha, bloqueos,
 * vencimientos) vive allá; acá solo se muestran sus mensajes.
 *
 * Los errores llegan como `Error` con un texto listo para mostrar.
 */
@Injectable({ providedIn: 'root' })
export class RecuperacionContrasenaService {

  private static readonly TIMEOUT_MS = 30000;

  constructor(private http: HttpClient, private configService: ConfiguracionService) { }

  captcha(): Observable<CaptchaRecuperacion> {
    return this.get<CaptchaRecuperacion>('captcha');
  }

  verificar(nickname: string, documento: string, captchaId: string, captchaRespuesta: string): Observable<VerificacionRecuperacion> {
    return this.post<VerificacionRecuperacion>('verificar',
      { nickname, documento, captchaId, captchaRespuesta });
  }

  solicitudRrhh(verificacionToken: string, telefono: string, email: string,
                observacion: string): Observable<SolicitudRrhhCreada> {
    return this.post<SolicitudRrhhCreada>('solicitud-rrhh', { verificacionToken, telefono, email, observacion });
  }

  consultar(solicitudId: number, codigo: string, documento: string): Observable<EstadoRecuperacion> {
    return this.post<EstadoRecuperacion>('consultar', { solicitudId, codigo, documento });
  }

  restablecer(solicitudId: number, codigo: string, documento: string,
              nuevaContrasena: string): Observable<EstadoRecuperacion> {
    return this.post<EstadoRecuperacion>('restablecer', { solicitudId, codigo, documento, nuevaContrasena });
  }

  private get<T>(ruta: string): Observable<T> {
    const base = this.base();
    if (base == null) return this.sinCentral();
    return this.http.get<T>(`${base}/${ruta}`).pipe(
      timeout(RecuperacionContrasenaService.TIMEOUT_MS),
      catchError((e) => throwError(() => new Error(this.mensaje(e)))));
  }

  private post<T>(ruta: string, body: any): Observable<T> {
    const base = this.base();
    if (base == null) return this.sinCentral();
    return this.http.post<T>(`${base}/${ruta}`, body).pipe(
      timeout(RecuperacionContrasenaService.TIMEOUT_MS),
      catchError((e) => throwError(() => new Error(this.mensaje(e)))));
  }

  private base(): string | null {
    const config = this.configService.getConfig();
    if (!config?.serverCentralIp) return null;
    return `${urlsDeServidor(config.serverCentralIp, config.serverCentralPort).http}/public/recuperacion-contrasena`;
  }

  private sinCentral<T>(): Observable<T> {
    return throwError(() => new Error('No hay un servidor central configurado. Revise la configuración del sistema.'));
  }

  private mensaje(e: any): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0) {
        return 'No se pudo conectar con el servidor central. Verifique la conexión e intente nuevamente.';
      }
      if (e.error?.message) return e.error.message;
      if (e.status === 404) return 'El servidor central todavía no tiene esta función. Avise al soporte.';
    }
    if (e?.name === 'TimeoutError') {
      return 'El servidor central no respondió a tiempo. Intente nuevamente.';
    }
    return 'No se pudo procesar el pedido. Intente nuevamente.';
  }
}
