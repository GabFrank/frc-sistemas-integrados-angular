import { Injectable } from "@angular/core";
import { Apollo } from "apollo-angular";
import { Observable } from "rxjs";
import { TabService } from "../../../layouts/tab/tab.service";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { DialogosService } from "../../../shared/components/dialogos/dialogos.service";
import { GenericListService } from "../../../shared/components/generic-list/generic-list.service";
import { productosSearch } from "../../productos/producto/graphql/graphql-query";
import { EditSucursalComponent } from "./edit-sucursal/edit-sucursal.component";
import {
  deleteSucursalQuery,
  saveSucursal,
  sucursalQuery,
} from "./graphql/graphql-query";
import { SucursalesGQL } from "./graphql/sucursalesQuery";
import { ListSucursalComponent } from "./list-sucursal/list-sucursal.component";
import { Sucursal } from "./sucursal.model";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { serverAdress } from "../../../../environments/environment";
import { SucursalActualGQL } from "./graphql/sucursalActual";
import { GenericCrudService } from "../../../generics/generic-crud.service";

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
    public getAllSucursales: SucursalesGQL,
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
          `http://${serverAdress.serverIp}:${serverAdress.serverPort}/sucursales`,
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
