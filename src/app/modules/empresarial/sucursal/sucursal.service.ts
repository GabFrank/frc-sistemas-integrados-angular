import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { SucursalesGQL } from "./graphql/sucursalesQuery";
import { Sucursal } from "./sucursal.model";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment, serverAdress } from "../../../../environments/environment";
import { SucursalActualGQL } from "./graphql/sucursalActual";

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class SucursalService {
  httpOptions = {
    headers: new HttpHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
  };

  constructor(
    private getAllSucursales: SucursalesGQL,
    private notificacionBar: NotificacionSnackbarService,
    private getSucursalActual: SucursalActualGQL,
    private http: HttpClient
  ) {}

  onGetAllSucursales(): Observable<Sucursal[]> {
    return new Observable((obs) => {
      this.getAllSucursales
        .fetch(
          {},
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups! algo salio mal: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });
  }

  onGetSucursalActual(): Observable<Sucursal>{
    return new Observable((obs) => {
      this.getSucursalActual
        .fetch(
          {},
          {
            fetchPolicy: "no-cache",
            errorPolicy: "all",
          }
        )
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          if (res.errors == null) {
            obs.next(res.data["data"]);
          } else {
            this.notificacionBar.notification$.next({
              texto: "Ups! algo salio mal: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        });
    });  }

  getSucursalesAdmin(): Observable<any> {
    return new Observable((obs) => {
      let httpBody = {
        nickname: "ADMIN",
        password: "ADMIN",
      };
      let httpResponse = this.http
        .post(
          `http://${environment['serverIp']}:${environment['serverPort']}/sucursales`,
          httpBody,
          this.httpOptions
        )
        .pipe(untilDestroyed(this))
        .subscribe(
          (res) => {
            obs.next(res)
          },
          (error) => {
            obs.next(error);
          }
        );
    });
  }
}
