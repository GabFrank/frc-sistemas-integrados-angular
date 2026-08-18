import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MainService } from "../../main.service";
import { Usuario } from "../personas/usuarios/usuario.model";
import { UsuarioService } from "../personas/usuarios/usuario.service";
import { ConfiguracionService } from "../../shared/services/configuracion.service";

export interface LoginResponse {
  usuario?: Usuario;
  error?: HttpErrorResponse;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Observable, of } from "rxjs";
import { catchError, tap, timeout } from 'rxjs/operators';
import { DeviceDetectorService } from "ngx-device-detector";
import { generateUUID } from "../../commons/core/utils/string-utils";
import { ElectronService } from "../../commons/core/electron/electron.service";
import { InicioSesion } from "../configuracion/models/inicio-sesion.model";
import { TipoDispositivo } from "../configuracion/inicio-sesion/tipo-dispositivo.model";
import { NotificarInicioSesionGQL } from "../configuracion/inicio-sesion/graphql/notificarInicioSesion.gql";
import { urlsDeServidor } from '../../commons/core/utils/webEndpoints';

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class LoginService {
  appVersion = null;

  httpOptions = {
    headers: new HttpHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
  };

  constructor(
    private http: HttpClient,
    private usuarioService: UsuarioService,
    public mainService: MainService,
    private deviceDetector: DeviceDetectorService,
    private electronService: ElectronService,
    private configService: ConfiguracionService,
    private notificarInicioSesionGQL: NotificarInicioSesionGQL
  ) { }

  private resolveTipoDispositivo(): TipoDispositivo {
    if (this.electronService.isElectron) {
      const platform = window.navigator.platform.toLowerCase();
      if (platform.includes("win")) {
        return TipoDispositivo.DESKTOP_WIN;
      }
      if (platform.includes("mac")) {
        return TipoDispositivo.DESKTOP_MAC;
      }
      return TipoDispositivo.DESKTOP_LIN;
    }
    if (this.deviceDetector.isMobile()) {
      return TipoDispositivo.WEB_MOBILE;
    }
    return TipoDispositivo.WEB;
  }

  private registrarSesionActiva(usuario: Usuario, servidor: boolean): void {
    const inicioSesion = new InicioSesion();
    inicioSesion.usuario = usuario;
    inicioSesion.sucursal = this.mainService?.sucursalActual;
    inicioSesion.creadoEn = new Date();
    inicioSesion.tipoDespositivo = this.resolveTipoDispositivo();

    let deviceId = localStorage.getItem("deviceId");
    if (deviceId == null) {
      deviceId = generateUUID();
      localStorage.setItem("deviceId", deviceId);
    }
    inicioSesion.idDispositivo = deviceId;
    inicioSesion.token = localStorage.getItem("pushToken");

    const sesionExistente = usuario?.inicioSesion;
    if (sesionExistente?.idDispositivo === deviceId && sesionExistente?.id) {
      inicioSesion.id = sesionExistente.id;
      inicioSesion.horaInicio = sesionExistente.horaInicio
        ? new Date(sesionExistente.horaInicio)
        : new Date();
    } else {
      inicioSesion.horaInicio = new Date();
    }

    this.usuarioService
      .onSaveInicioSesion(inicioSesion.toInput(), servidor)
      .subscribe((res) => {
        this.mainService.usuarioActual.inicioSesion = res;
      });
  }

  /**
   * Cierra la sesion activa. Sin `servidor` explicito el destino lo resuelve
   * `onSaveInicioSesion` desde la configuracion, para que el cierre vaya al
   * mismo lado que la apertura (ver `registrarSesionActiva`).
   */
  cerrarSesionActiva(servidor?: boolean): void {
    const sesionActual = this.mainService.usuarioActual?.inicioSesion;
    if (!sesionActual?.id || !sesionActual?.sucursal) {
      return;
    }

    const inicioSesion = new InicioSesion();
    Object.assign(inicioSesion, sesionActual);
    inicioSesion.horaFin = new Date();
    inicioSesion.token = null;
    this.usuarioService
      .onSaveInicioSesion(inicioSesion.toInput(), servidor)
      .subscribe();
  }

  login(nickname: string, password: string, keepLogged: boolean = false): Observable<LoginResponse> {
    return new Observable((obs) => {
      const config = this.configService.getConfig();
      const serverIp = config.isLocal ? config.serverIp : config.serverCentralIp;
      const serverPort = config.isLocal ? config.serverPort : config.serverCentralPort;

      let httpBody = {
        nickname: nickname,
        password: password
      };
      let httpResponse = this.http
        .post(
          `${urlsDeServidor(serverIp, serverPort).http}/login`,
          httpBody,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            if (res["token"] != null) {
              localStorage.setItem("token", res["token"]);
              localStorage.setItem("keepLogged", keepLogged.toString());

              if (res["usuarioId"] != null) {
                localStorage.setItem("usuarioId", res["usuarioId"]);
              }

              this.mainService.sucursalActual = res["sucursal"];
              if (config.isLocal) {
                this.autenticarEnCentral(nickname, password).subscribe();
              }

              setTimeout(() => {
                if (res["usuarioId"] != null) {
                  this.usuarioService
                    .onGetUsuarioParaLogin(res["usuarioId"], !config.isLocal)
                    .pipe(untilDestroyed(this))
                    .subscribe((res) => {
                      if (res?.id != null) {
                        this.mainService.usuarioActual = res;
                        this.registrarSesionActiva(res, !config.isLocal);
                        this.notificarInicioSesion(res.id);

                        let response: LoginResponse = {
                          usuario: res,
                          error: null,
                        };
                        obs.next(response);
                      }
                    });
                }
              }, 500);
            } else {
              const response: LoginResponse = {
                usuario: null,
                // El filial responde 200 con LoginResponse.aviso (ej: "Usuario
                // inactivo, contacte al administrador"); sin leer 'aviso' el motivo
                // real se perdía detrás del mensaje genérico de credenciales.
                error: this.buildAuthErrorResponse(
                  res?.["message"] || res?.["mensaje"] || res?.["aviso"]
                ),
              };
              obs.next(response);
            }
          },
          (error) => {
            let response: LoginResponse = {
              usuario: null,
              error: this.normalizeLoginError(error),
            };
            obs.next(response);
          }
        );
    });
  }

  private notificarInicioSesion(usuarioId: number): void {
    this.notificarInicioSesionGQL
      .mutate({ usuarioId })
      .pipe(
        untilDestroyed(this),
        catchError((err) => {
          console.warn("No se pudo notificar inicio de sesion", err);
          return of(null);
        })
      )
      .subscribe();
  }

  autenticarEnCentral(nickname: string, password: string): Observable<any> {
    const config = this.configService.getConfig();
    const centralIp = config.serverCentralIp;
    const centralPort = config.serverCentralPort;

    if (!centralIp || !centralPort) return of(null);

    return this.http.post(`${urlsDeServidor(centralIp, centralPort).http}/login`, {
      nickname: nickname,
      password: password
    }, this.httpOptions).pipe(
      // Si el central está offline, no dejar esta petición colgada: se corta a
      // los 3s y el catchError la resuelve silenciosamente (es fire-and-forget).
      timeout(3000),
      tap((res: any) => {
        if (res && res.token) {
          localStorage.setItem("token_central", res.token);
        }
      }),
      catchError(err => {
        console.error("Error al autenticar en servidor central para notificaciones", err);
        return of(null);
      })
    );
  }

  private normalizeLoginError(error: HttpErrorResponse): HttpErrorResponse {
    if (!error) {
      return this.buildServerErrorResponse(
        "Error de conexión con el servidor. Verifique la configuración."
      );
    }

    // Mensaje que realmente mandó el backend en el body (el central devuelve 401
    // con {"message": ...}). error.message es el texto que arma Angular y no sirve
    // para mostrarle al usuario, solo para clasificar el error.
    const bodyMessage =
      error?.error?.message ||
      error?.error?.mensaje ||
      error?.error?.aviso ||
      "";
    const serverMessage = bodyMessage || error?.message || "";
    const normalized = String(serverMessage).toLowerCase();
    const isInvalidCredentials =
      error?.status === 401 ||
      normalized.includes("contrase") ||
      normalized.includes("credencial") ||
      normalized.includes("bad credential") ||
      normalized.includes("usuario no existe") ||
      normalized.includes("unauthorized");

    if (isInvalidCredentials) {
      // Si el backend explicó el motivo (usuario inactivo, usuario inexistente),
      // se muestra ese texto en vez del genérico de credenciales.
      return bodyMessage
        ? this.buildAuthErrorResponse(bodyMessage)
        : this.buildAuthErrorResponse();
    }

    if (error?.status === 0) {
      return this.buildServerErrorResponse(
        "Error de conexión con el servidor. Verifique la configuración."
      );
    }

    return this.buildServerErrorResponse(
      "No se pudo iniciar sesión por un error del servidor. Intente nuevamente."
    );
  }

  private buildAuthErrorResponse(
    message: string = "Usuario o contraseña incorrectos. Verifique e intente nuevamente."
  ): HttpErrorResponse {
    return new HttpErrorResponse({
      status: 401,
      statusText: "Unauthorized",
      error: { message },
    });
  }

  private buildServerErrorResponse(message: string): HttpErrorResponse {
    return new HttpErrorResponse({
      status: 500,
      statusText: "Server Error",
      error: { message },
    });
  }
}
