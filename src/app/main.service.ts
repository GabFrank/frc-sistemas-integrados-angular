import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject, Observable, Subscription, takeUntil } from "rxjs";
import { ipAddress } from "../environments/conectionConfig";
import { environment } from "../environments/environment";
import { SucursalByIdGQL } from "./modules/empresarial/sucursal/graphql/sucursalById";
import { Sucursal } from "./modules/empresarial/sucursal/sucursal.model";
import { MonedasGetAllGQL } from "./modules/financiero/moneda/graphql/monedasGetAll";
import { Moneda } from "./modules/financiero/moneda/moneda.model";
import { Usuario } from "./modules/personas/usuarios/usuario.model";
import { UsuarioService } from "./modules/personas/usuarios/usuario.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SucursalService } from "./modules/empresarial/sucursal/sucursal.service";

@UntilDestroy()
@Injectable({
  providedIn: "root",
})
export class MainService implements OnDestroy {
  sucursalActual: Sucursal;
  usuarioActual: Usuario;
  fechaHoraInicioSesion: Date;
  primaryColor: "#C62828";
  green: "#27AE60";
  monedas: Moneda[] = [];
  ciudadId: 1;
  status;
  statusSub: Subscription;
  authenticationSub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    null
  );
  hasNetworkConnection: boolean;
  hasInternetAccess: boolean;
  ipLocal = "";
  logged = false;
  serverIpAddres = ipAddress;
  authSub;
  isServidor = false;

  // isUserLoggerSub = new BehaviorSubject<boolean>(false);

  constructor(
    private getSucursalById: SucursalByIdGQL,
    private getMonedas: MonedasGetAllGQL,
    private usuarioService: UsuarioService,
    private matDialog: MatDialog,
    private http: HttpClient,
    private sucursalService: SucursalService
  ) {
    this.http
      .get("http://api.ipify.org/?format=json")
      .subscribe((res: any) => {
        this.ipLocal = res.ip;
      })
    localStorage.setItem("serverIpAddress", this.serverIpAddres);
  }

  isAuthenticated(): Observable<boolean> {
    console.log("Verificando autenticacion...");
    return new Observable((obs) => {
      let isToken = localStorage.getItem("token");
      console.log(isToken)
      if (isToken != null) {
        this.getUsuario()
        .pipe(untilDestroyed(this))
        .subscribe((res) => {
          console.log('respuesta: ', res)
          if (res) {
            console.log('usuario encontrado: ', res)
            obs.next(true);
            this.authenticationSub.next(res);
          } else {
            obs.next(false);
            this.authenticationSub.next(res);
          }
        });
      } else {
        obs.next(false);
      }
    });
  }

  getUsuario(): Observable<boolean> {
    console.log('entrando al getUsuario')
    return new Observable((obs) => {
      let id = localStorage.getItem("usuarioId");
      console.log(id)
      if (id != null) {
        this.usuarioService
          .onGetUsuario(+id)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res != null) {
              console.log(res)
              this.usuarioActual = res;
              obs.next(true);
            } else {
              obs.next(false);
            }
          })
      } else {
        obs.next(false);
      }
    });
  }

  load(): Promise<boolean> {
    let res;
    this.sucursalService.onGetSucursalActual()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if(res!=null){
          this.sucursalActual = res;
          if(this.sucursalActual?.nombre == 'SERVIDOR'){
            this.isServidor = true;
          }
        }
      });
    this.getMonedas
      .fetch()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res.errors == null) {
          this.monedas = res.data.data;
        }
      });
    return res;
  }

  changeServerIpAddress(text) {
    localStorage.setItem("serverIpAddress", text);
    this.serverIpAddres = localStorage.getItem("serverIpAddress");
  }

  ngOnDestroy(): void {}
}
