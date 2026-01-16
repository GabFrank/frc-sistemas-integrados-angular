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
import { Observable } from "rxjs";
import { DeviceDetectorService } from "ngx-device-detector";
import { generateUUID } from "../../commons/core/utils/string-utils";
import { ElectronService } from "../../commons/core/electron/electron.service";
import { InicioSesion } from "../configuracion/models/inicio-sesion.model";
import { NotificarInicioSesionGQL } from "../configuracion/inicio-sesion/graphql/notificarInicioSesion.gql";

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
          `http://${serverIp}:${serverPort}/login`,
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
                          this.notificarInicioSesionGQL.mutate({ usuarioId: res.id }).pipe(untilDestroyed(this)).subscribe();
                          this.enviarNotificacionLogin(serverIp, serverPort, this.mainService.usuarioActual);
                        } else {
                          this.usuarioService
                            .onSaveInicioSesion(inicioSesion.toInput())
                            .subscribe((res) => {
                              this.notificarInicioSesionGQL.mutate({ usuarioId: res.usuario.id }).pipe(untilDestroyed(this)).subscribe();
                              this.mainService.usuarioActual.inicioSesion = res;
                              this.enviarNotificacionLogin(serverIp, serverPort, this.mainService.usuarioActual);
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
  private enviarNotificacionLogin(serverIp: string, serverPort: string, usuario: any): void {
  }
}
