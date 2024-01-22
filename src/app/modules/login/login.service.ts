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

export interface LoginResponse {
  usuario?: Usuario;
  error?: HttpErrorResponse;
}

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Observable } from "rxjs";
import { InicioSesion } from "../configuracion/models/inicio-sesion.model";
import { DeviceDetectorService } from "ngx-device-detector";
import { generateUUID } from "../../commons/core/utils/string-utils";
import { ElectronService } from "../../commons/core/electron/electron.service";

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
    private electronService: ElectronService
  ) {}

  login(nickname, password): Observable<LoginResponse> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: nickname,
        password: password,
      };
      let httpResponse = this.http
        .post(
          `http://${environment["serverIp"]}:${environment["serverPort"]}/login`,
          httpBody,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            if (res["token"] != null) {
              localStorage.setItem("token", res["token"]);
              this.mainService.sucursalActual = res["sucursal"];
              setTimeout(() => {
                if (res["usuarioId"] != null) {
                  localStorage.setItem("usuarioId", res["usuarioId"]);
                  this.usuarioService
                    .onGetUsuario(res["usuarioId"])
                    .pipe(untilDestroyed(this))
                    .subscribe((res) => {
                      if (res?.id != null) {
                        console.log(res);

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

                        if (
                          res?.inicioSesion != null &&
                          res?.inicioSesion?.idDispositivo == deviceId &&
                          res?.inicioSesion?.sucursal != null
                        ) {
                          console.log("Dispositivo conocido encontrado");
                        } else {
                          if (this.mainService)
                            console.log("Nuevo disposito encontrado");
                          this.usuarioService
                            .onSaveInicioSesion(inicioSesion.toInput())
                            .subscribe((res) => {
                              console.log(res);
                              this.mainService.usuarioActual.inicioSesion = res;
                            });
                        }

                        let response: LoginResponse = {
                          usuario: res,
                          error: null,
                        };
                        obs.next(response);
                      } else {
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
}
