import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { MainService } from "../../main.service";
import { Usuario } from "../personas/usuarios/usuario.model";
import { UsuarioService } from "../personas/usuarios/usuario.service";
import { ConfiguracionService } from "../../shared/services/configuracion.service";

export interface LoginResponse {
  usuario?: Usuario;
  error?: HttpErrorResponse;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { DeviceDetectorService } from "ngx-device-detector";
import { generateUUID } from "../../commons/core/utils/string-utils";
import { ElectronService } from "../../commons/core/electron/electron.service";
import { InicioSesion } from "../configuracion/models/inicio-sesion.model";

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
    private configService: ConfiguracionService
  ) {}

  login(nickname: string, password: string, keepLogged: boolean = false): Observable<LoginResponse> {
    return new Observable((obs) => {
      // Get the server configuration from ConfiguracionService
      const config = this.configService.getConfig();
      
      // Determine which server to use based on isLocal flag
      const serverIp = config.isLocal ? config.serverIp : config.serverCentralIp;
      const serverPort = config.isLocal ? config.serverPort : config.serverCentralPort;
      
      console.log("isLocal", config.isLocal);
      console.log("serverIp", serverIp);
      console.log("serverPort", serverPort);
      
      let httpBody = {
        nickname: nickname,
        password: password
        // keepLogged is managed only on frontend, not sent to backend
      };
      let httpResponse = this.http
        .post(
          `http://${serverIp}:${serverPort}/login`,
          httpBody,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            console.log("res", res);
            if (res["token"] != null) {
              // Store token and user ID in localStorage always
              localStorage.setItem("token", res["token"]);
              // Store the keepLogged preference locally
              localStorage.setItem("keepLogged", keepLogged.toString());
              
              if (res["usuarioId"] != null) {
                localStorage.setItem("usuarioId", res["usuarioId"]);
              }
              
              this.mainService.sucursalActual = res["sucursal"];
              setTimeout(() => {
                if (res["usuarioId"] != null) {
                  this.usuarioService
                    .onGetUsuario(res["usuarioId"], !config.isLocal)
                    .pipe(untilDestroyed(this))
                    .subscribe((res) => {
                      if (res?.id != null) {
                        this.mainService.usuarioActual = res;
                        let inicioSesion = new InicioSesion();
                        inicioSesion.usuario = res;
                        inicioSesion.sucursal =
                          this.mainService?.sucursalActual;
                        inicioSesion.horaInicio = new Date();
                        inicioSesion.creadoEn = new Date();
                        
                        let deviceId = localStorage.getItem("deviceId");
                        if (deviceId == null) {
                          let uuid = generateUUID();
                          localStorage.setItem("deviceId", uuid);
                          deviceId = uuid;
                        }
                        inicioSesion.idDispositivo = deviceId;
                        inicioSesion.token = localStorage.getItem("pushToken");

                        if (
                          res?.inicioSesion != null &&
                          res?.inicioSesion?.idDispositivo == deviceId &&
                          res?.inicioSesion?.sucursal != null
                        ) {
                          console.log("Dispositivo conocido encontrado");
                          // Enviar notificación incluso si es un dispositivo conocido
                          this.enviarNotificacionLogin(serverIp, serverPort, res);
                        } else {
                          if (this.mainService)
                            console.log("Nuevo disposito encontrado");
                          this.usuarioService
                            .onSaveInicioSesion(inicioSesion.toInput())
                            .subscribe((res) => {
                              console.log(res);
                              this.mainService.usuarioActual.inicioSesion = res;
                              // Enviar notificación después de guardar inicio de sesión
                              this.enviarNotificacionLogin(serverIp, serverPort, res);
                            });
                        }

                        let response: LoginResponse = {
                          usuario: res,
                          error: null,
                        };
                        obs.next(response);
                      }
                    });
                }
              }, 500);
            }
          },
          (error) => {
            let response: LoginResponse = {
              usuario: null,
              error: error,
            };
            obs.next(error);
          }
        );
    });
  }

  /**
   * Envía una notificación push al iniciar sesión
   */
  private enviarNotificacionLogin(serverIp: string, serverPort: string, usuario: any): void {
    const pushToken = localStorage.getItem("pushToken");
    if (pushToken) {
      const notificationBody = {
        title: "Inicio de sesión exitoso",
        message: `Bienvenido ${usuario?.nickname || usuario?.nombre || 'Usuario'}`,
        token: pushToken,
        data: "/",
      };
      
      // Enviar notificación al backend
      this.http
        .post(
          `http://${serverIp}:${serverPort}/notification/token`,
          notificationBody,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          () => {
            console.log("✅ Notificación de login enviada al servidor");
          },
          (err) => {
            console.error("❌ Error enviando notificación de login al servidor", err);
          }
        );

      // Mostrar notificación local si estamos en Electron o navegador con soporte
      if (this.electronService.isElectron || typeof Notification !== 'undefined') {
        try {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            const notification = new Notification(notificationBody.title, {
              body: notificationBody.message,
              icon: '/assets/logo.ico', // Ajusta la ruta según tu proyecto
              badge: '/assets/logo.ico',
            });
            
            notification.onclick = () => {
              window.focus();
              notification.close();
            };
            
            // Cerrar la notificación después de 5 segundos
            setTimeout(() => {
              notification.close();
            }, 5000);
            
            console.log("✅ Notificación local mostrada");
          } else if (typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
            // Solicitar permiso si no está concedido
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                const notification = new Notification(notificationBody.title, {
                  body: notificationBody.message,
                  icon: '/assets/logo.ico',
                });
                setTimeout(() => notification.close(), 5000);
              }
            });
          }
        } catch (error) {
          console.error("❌ Error mostrando notificación local", error);
        }
      }
    } else {
      console.warn("⚠️ No hay pushToken disponible para enviar notificación");
    }
  }
}
