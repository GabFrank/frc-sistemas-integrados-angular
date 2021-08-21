import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { catchError, tap } from "rxjs/operators";
import { Observable } from "zen-observable-ts";
import { MainService } from "../../main.service";
import { CargandoDialogComponent } from "../../shared/components/cargando-dialog/cargando-dialog.component";
import { CargandoDialogService } from "../../shared/components/cargando-dialog/cargando-dialog.service";
import { Usuario } from "../personas/usuarios/usuario.model";
import { UsuarioService } from "../personas/usuarios/usuario.service";

export interface LoginResponse {
  usuario?: Usuario;
  error?: HttpErrorResponse;
}

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
    private mainService: MainService,
    private matDialog: MatDialog
  ) {}

  login(nickname, password): Observable<LoginResponse> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: nickname,
        password: password,
      };
      let httpResponse = this.http
        .post("http://localhost:8081/login", httpBody, this.httpOptions)
        .subscribe((res) => {
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
                      let response: LoginResponse = {
                        usuario : res,
                        error: null
                      }
                      obs.next(response);
                    } else {
                      console.log(res);
                    }
                  });
              }
            }, 500);
          }
        }, (error)=> {
          let response: LoginResponse = {
            usuario : null,
            error: error
          }
          console.log(error)
          obs.next(error)
        });
    });
  }
}
