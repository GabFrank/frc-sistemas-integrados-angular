import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { environment } from "../environments/environment";
import { MainService } from "./main.service";
import { Usuario } from "./modules/personas/usuarios/usuario.model";
import { UsuarioService } from "./modules/personas/usuarios/usuario.service";

export interface LoginResponse {
  usuario?: Usuario;
  error?: HttpErrorResponse;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from "rxjs";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class LoginService {
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
    private matDialog: MatDialog,
  ) {}

  login(nickname, password): Observable<LoginResponse> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: nickname,
        password: password,
      };
      let httpResponse = this.http
        .post(
          `http://${environment['serverIp']}:${environment['serverPort']}/login`,
          httpBody,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            if (res["token"] != null) {
              localStorage.setItem("token", res["token"]);
              setTimeout(() => {
                if (res["usuarioId"] != null) {
                  localStorage.setItem("usuarioId", res["usuarioId"]);
                  this.usuarioService
                    .onGetUsuario(res["usuarioId"])
                    .subscribe((res) => {
                      if (res?.id != null) {
                        this.mainService.usuarioActual = res;
                        this.mainService.authenticationSub.next(true);
                        this.mainService.load()
                        let response: LoginResponse = {
                          usuario: res,
                          error: null,
                        };
                        obs.next(response);
                        obs.complete()
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
            this.mainService.authenticationSub.next(false);
            obs.next(error);
          }
        );
    });
    
  }
}
