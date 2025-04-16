import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Observable, Subscription } from "rxjs";
import { ElectronService } from "../../../commons/core/electron/electron.service";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
import { CargandoDialogService } from "../cargando-dialog/cargando-dialog.service";
import { LoginService } from "./../../../modules/login/login.service";
import { SearchBarDialogComponent } from "./../../widgets/search-bar-dialog/search-bar-dialog.component";

import { isDevMode } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { environment } from "../../../../environments/environment";
import { TipoEntidad } from "../../../generics/tipo-entidad.enum";
import { ActualizacionService } from "../../../modules/configuracion/actualizacion/actualizacion.service";
import { ConfiguracionService } from "../../services/configuracion.service";
import { ConfiguracionDialogComponent } from "../configuracion-dialog/configuracion-dialog.component";
import { ROLES } from "../../../modules/personas/roles/roles.enum";
import { QrCodeComponent, QrData } from "../../qr-code/qr-code.component";
import { DialogosService } from "../dialogos/dialogos.service";
import { UsuarioService } from "../../../modules/personas/usuarios/usuario.service";
import { resolve } from "path";
import { rejects } from "assert";
import { InicioSesion } from "../../../modules/configuracion/models/inicio-sesion.model";
import { connectionStatusSub, cloudConnectionStatusSub } from "../../services/graphql-connection.service";

// import { ApolloConfigService } from '../../../apollo-config.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDev = isDevMode();
  isLocalhost = false;
  isLocal = true; // Flag to indicate if local server is enabled
  localStatus = false;
  cloudStatus = false;
  // Flag to indicate that one server is down
  serverWarning = false;
  statusObs: Observable<any>;
  serverIpAddress = "";
  editServerIp = false;
  serverIpControl = new FormControl();
  localStatusSub: Subscription;
  cloudStatusSub: Subscription;
  configChangedSub: Subscription;
  sucursalList: any[];
  readonly ROLES = ROLES;
  @Output() toogleSideBarEvent: EventEmitter<any> = new EventEmitter();
  appVersion = null;

  constructor(
    public mainService: MainService,
    private matDialog: MatDialog,
    private cargandoDialogService: CargandoDialogService,
    private router: Router,
    private tabService: TabService,
    private electronService: ElectronService,
    private loginService: LoginService,
    private actualizacionService: ActualizacionService,
    private configService: ConfiguracionService,
    private dialogoService: DialogosService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    // Get config and set isLocal flag
    const config = this.configService.getConfig();
    this.isLocalhost = config.serverIp === "localhost";
    this.isLocal = config.isLocal;

    // Subscribe to config changes to update isLocal flag
    this.configChangedSub = this.configService.configChanged
      .pipe(untilDestroyed(this))
      .subscribe(newConfig => {
        this.isLocal = newConfig.isLocal;
        this.isLocalhost = newConfig.serverIp === "localhost";
        this.updateServerWarning();
      });

    // Local server status subscription
    this.localStatusSub = connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.localStatus = res;
        this.updateServerWarning();
      });
    
    // Cloud server status subscription
    this.cloudStatusSub = cloudConnectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.cloudStatus = res;
        this.updateServerWarning();
      });

    // Use empty array as fallback if environment doesn't have sucursales
    this.sucursalList = environment["sucursales"] || [];

    this.appVersion = this.electronService.getAppVersion();
  }

  /**
   * Updates the server warning flag based on server status
   * We have a warning when one server is connected but the other is not
   */
  private updateServerWarning(): void {
    // If both statuses are initialized (not null)
    if (this.cloudStatus != null) {
      if (this.isLocal && this.localStatus != null) {
        // Only consider local status for warning if isLocal is true
        this.serverWarning = (this.localStatus && !this.cloudStatus) || (!this.localStatus && this.cloudStatus);
      } else {
        // If isLocal is false, only care about cloud status
        this.serverWarning = !this.cloudStatus;
      }
    } else {
      this.serverWarning = false;
    }
  }

  toogleSideBar() {
    this.toogleSideBarEvent.emit();
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 300);
  }

  async onLogout() {
    let inicioSesion = new InicioSesion();
    Object.assign(inicioSesion, this.mainService.usuarioActual.inicioSesion);
    inicioSesion.horaFin = new Date();  
    if(inicioSesion != null && inicioSesion?.sucursal != null){
      await new Promise((resolve, rejects) => {
        this.usuarioService
          .onSaveInicioSesion(inicioSesion.toInput())
          .subscribe((res) => {
            resolve(res);
          });
      }); 
    }  
    localStorage.removeItem("token");
    localStorage.removeItem("usuarioId");
    this.mainService.usuarioActual = null;
    this.mainService.logged = false;
    this.tabService.removeAllTabs();
    this.electronService.relaunch();
  }

  onLogin() {
    this.electronService.relaunch();
  }

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.localStatusSub.unsubscribe();
    if (this.cloudStatusSub) {
      this.cloudStatusSub.unsubscribe();
    }
    if (this.configChangedSub) {
      this.configChangedSub.unsubscribe();
    }
  }

  onSearch() {
    this.matDialog.open(SearchBarDialogComponent, {
      data: null,
      width: "50%",
    });
  }

  removeServer() {
    // this.apolloService.removeClient()
    // this.apolloService.connectClient()
  }

  createQrCode() {
    let codigo: QrData = {
      sucursalId: this.mainService.sucursalActual.id,
      tipoEntidad: TipoEntidad.SUCURSAL,
      idOrigen: null,
      idCentral: null,
      componentToOpen: null,
    };
    this.matDialog
      .open(QrCodeComponent, {
        data: {
          codigo: codigo,
          nombre: "Sucursal",
        },
      })
      .afterClosed()
      .subscribe((res) => {});
  }

  /**
   * Opens the configuration dialog to modify system settings
   */
  openConfigDialog() {
    this.configService
      .showConfigDialog()
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (result) {
          // Configuration was updated, check if we need to restart
          this.dialogoService
            .confirm("Configuración actualizada", "¿Desea reiniciar ahora para aplicar los cambios?")
            .subscribe((shouldRestart) => {
              if (shouldRestart) {
                this.electronService.relaunch();
              }
            });
        }
      });
  }

  onGetConfiguracion() {
    this.openConfigDialog();
  }

  cambiarSucursal(sucursal) {
    if (sucursal != null) {
      this.dialogoService
        .confirm("Atención!!", "Realmente quieres cambiar de sucursal?")
        .subscribe((res) => {
          if (res) {
            this.configService.updateConfig({
              serverIp: sucursal["ip"]
            });
            this.electronService.relaunch();
          }
        });
    }
  }

  onDevMode(server) {
    this.configService.updateConfig({
      serverIp: "localhost"
    });
    this.electronService.relaunch();
  }
}
