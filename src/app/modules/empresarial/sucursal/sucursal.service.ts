import { Injectable, Injector } from "@angular/core";
import { Observable } from "rxjs";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "../../../notificacion-snackbar.service";
import { SucursalesGQL } from "./graphql/sucursalesQuery";
import { Sucursal } from "./sucursal.model";

import { HttpClient, HttpHeaders } from "@angular/common/http";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { environment } from "../../../../environments/environment";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { SucursalActualGQL } from "./graphql/sucursalActual";
import { SucursalByIdGQL } from "./graphql/sucursalById";
import { CargandoDialogService } from "../../../shared/components/cargando-dialog/cargando-dialog.service";

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

  isLoading = false;

  constructor(
    private getAllSucursales: SucursalesGQL,
    private notificacionBar: NotificacionSnackbarService,
    private getSucursalActual: SucursalActualGQL,
    private http: HttpClient,
    private injector: Injector,
    private sucursalPorId: SucursalByIdGQL,
    private cargandoService: CargandoDialogService,
    private notificacionSnackBar: NotificacionSnackbarService
  ) {
  }

  onGetSucursal(id): Observable<Sucursal> {
    this.isLoading = true;
    this.cargandoService.openDialog(false, 'Buscando...')
    return new Observable((obs) => {
      this.sucursalPorId
        .fetch({ id}, { fetchPolicy: "no-cache", errorPolicy: "all"}).pipe(untilDestroyed(this))
        .subscribe((res) => {
          this.cargandoService.closeDialog()
          this.isLoading = false;
          if (res.errors == null) {
            obs.next(res.data["data"]);
            if (res.data["data"] == null && res.data["error"] == false) {
              this.notificacionSnackBar.notification$.next({
                texto: "Item no encontrado",
                color: NotificacionColor.warn,
                duracion: 2,
              });
            }
          } else {
            this.notificacionSnackBar.notification$.next({
              texto: "Ups! Algo salió mal: " + res.errors[0].message,
              color: NotificacionColor.danger,
              duracion: 3,
            });
          }
        }, (err) => {
          this.notificacionBar.openWarn('Problema al realizar esta operación')
          this.cargandoService.closeDialog()
        });
    });  }

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

  onGetSucursalActual(): Observable<Sucursal> {
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
    });
  }

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
