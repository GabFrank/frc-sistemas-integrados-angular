import { HttpClient } from "@angular/common/http";
import { Injectable, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { ConfigFile } from "../environments/conectionConfig";
import { environment } from "../environments/environment";
import { SucursalByIdGQL } from "./modules/empresarial/sucursal/graphql/sucursalById";
import { Sucursal } from "./modules/empresarial/sucursal/sucursal.model";
import { MonedasGetAllGQL } from "./modules/financiero/moneda/graphql/monedasGetAll";
import { Moneda } from "./modules/financiero/moneda/moneda.model";
import { Usuario } from "./modules/personas/usuarios/usuario.model";
import { UsuarioService } from "./modules/personas/usuarios/usuario.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { IpcRenderer } from "electron";
import { ActualizacionService } from "./modules/configuracion/actualizacion/actualizacion.service";
import { SucursalService } from "./modules/empresarial/sucursal/sucursal.service";
import { MonedaService } from "./modules/financiero/moneda/moneda.service";
import { ConfiguracionService } from "./shared/services/configuracion.service";

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
  public renderer: IpcRenderer;
  configFile: ConfigFile

  // isUserLoggerSub = new BehaviorSubject<boolean>(false);

  constructor(
    // private getMonedas: MonedasGetAllGQL,
    public sucursalService: SucursalService,
    private usuarioService: UsuarioService,
    private configService: ConfiguracionService
  ) {
    // Get server IP from ConfiguracionService instead of environment
    const config = this.configService.getConfig();
    this.serverIpAddres = config.serverIp;
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
    // Update server configuration from ConfiguracionService
    const config = this.configService.getConfig();
    this.serverIpAddres = config.serverIp;
    
    // Create a Promise that resolves when sucursal is loaded or rejects after timeout
    return new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.warn('Sucursal loading timed out');
        resolve(false);
      }, 5000);
      
      this.sucursalService.onGetSucursalActual()
        .pipe(untilDestroyed(this))
        .subscribe({
          next: (res) => {
            clearTimeout(timeout);
            if (res != null) {          
              this.sucursalActual = res;
              if (this.sucursalActual?.id == 0) {
                this.isServidor = true;
              }
              resolve(true);
            } else {
              resolve(false);
            }
          },
          error: (err) => {
            clearTimeout(timeout);
            console.error('Error loading sucursal:', err);
            resolve(false);
          }
        });
    });
  }

  /**
   * Changes the server IP address using ConfiguracionService
   * This ensures all IP references are updated consistently
   */
  changeServerIpAddress(text: string) {
    this.configService.updateConfig({
      serverIp: text
    });
    this.serverIpAddres = text;
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
