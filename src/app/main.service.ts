import { HttpClient } from "@angular/common/http";
import { Injectable, Injector, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject, Observable, Subscription, takeUntil } from "rxjs";
import { ConfigFile, ipAddress } from "../environments/conectionConfig";
import { environment } from "../environments/environment";
import { SucursalByIdGQL } from "./modules/empresarial/sucursal/graphql/sucursalById";
import { Sucursal } from "./modules/empresarial/sucursal/sucursal.model";
import { MonedasGetAllGQL } from "./modules/financiero/moneda/graphql/monedasGetAll";
import { Moneda } from "./modules/financiero/moneda/moneda.model";
import { Usuario } from "./modules/personas/usuarios/usuario.model";
import { UsuarioService } from "./modules/personas/usuarios/usuario.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SucursalService } from "./modules/empresarial/sucursal/sucursal.service";
import { Actualizacion } from "./modules/configuracion/actualizacion/actualizacion.model";
import { ActualizacionService } from "./modules/configuracion/actualizacion/actualizacion.service";
import { IpcRenderer } from "electron";
import { ElectronService } from "../app/commons/core/electron/electron.service";

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
  serverIpAddres = environment['serverIp'];
  authSub;
  isServidor = false;
  private updateService: ActualizacionService;
  public renderer: IpcRenderer;
  configFile: ConfigFile

  // isUserLoggerSub = new BehaviorSubject<boolean>(false);

  constructor(
    private getSucursalById: SucursalByIdGQL,
    private getMonedas: MonedasGetAllGQL,
    private matDialog: MatDialog,
    private http: HttpClient,
    public sucursalService: SucursalService,
    private usuarioService: UsuarioService,
    private injector: Injector,
    private electronService: ElectronService
  ) {
    
    localStorage.setItem("serverIpAddress", this.serverIpAddres);

    
  }

  isAuthenticated(): Observable<boolean> {
    return new Observable((obs) => {
      let isToken = localStorage.getItem("token");
      if (isToken != null) {
        this.getUsuario()
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res) {
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
    return new Observable((obs) => {
      let id = localStorage.getItem("usuarioId");
      if (id != null) {
        this.usuarioService
          .onGetUsuario(+id)
          .pipe(untilDestroyed(this))
          .subscribe((res) => {
            if (res != null) {
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
        if (res != null) {
          this.sucursalActual = res;
          if (this.sucursalActual?.nombre == 'SERVIDOR') {
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

  // async getConfigFile(){
  //   this.configFile = await this.electronService.getConfigFile();
  // }

  // async getUrl(){
  //   return `http://${await this.configFile.serverUrl}:${await this.configFile.serverPor}/graphql`
  // }

  // async getWs(){
  //   return `ws://${await this.configFile.serverUrl}:${await this.configFile.serverPor}/subscriptions`
  // }

  ngOnDestroy(): void { }
}
