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
import { connectionStatusSub } from "../../../app.module";
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
import { ConfiguracionService } from "../../../modules/configuracion/configuracion.service";
import { ConfigurarServidorDialogComponent } from "../../../modules/configuracion/configurar-servidor-dialog/configurar-servidor-dialog.component";
import { ROLES } from "../../../modules/personas/roles/roles.enum";
import { QrCodeComponent, QrData } from "../../qr-code/qr-code.component";
import { DialogosService } from "../dialogos/dialogos.service";
import { UsuarioService } from "../../../modules/personas/usuarios/usuario.service";
import { resolve } from "path";
import { rejects } from "assert";
import { InicioSesion } from "../../../modules/configuracion/models/inicio-sesion.model";

// import { ApolloConfigService } from '../../../apollo-config.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDev = isDevMode();
  isLocalhost = localStorage.getItem("ip") == "localhost";
  status = false;
  statusObs: Observable<any>;
  serverIpAddress = "";
  editServerIp = false;
  serverIpControl = new FormControl();
  statusSub: Subscription;
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
    this.statusSub = connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.status = res;
      });

    this.sucursalList = environment["sucursales"];

    this.appVersion = this.electronService.getAppVersion();
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
    this.statusSub.unsubscribe();
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

  onGetConfiguracion() {
    this.configService
      .isConfigured()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!res) {
          this.matDialog.open(ConfigurarServidorDialogComponent, {
            width: "80%",
            height: "500px",
            disableClose: true,
          });
        }
      });
  }

  cambiarSucursal(sucursal) {
    if (sucursal != null) {
      this.dialogoService
        .confirm("Atención!!", "Realmente quieres cambiar de sucursal?")
        .subscribe((res) => {
          if (res) {
            localStorage.setItem("ip", sucursal["ip"]);
            localStorage.setItem("port", sucursal["port"]);
            localStorage.setItem("centralIp", environment["serverCentralIp"]);
            localStorage.setItem(
              "centralPort",
              environment["serverCentralPort"] + ""
            );
            this.electronService.relaunch();
          }
        });
    }
  }

  onDevMode(server) {
    localStorage.setItem("ip", "localhost");
    localStorage.setItem("port", server ? "8081" : "8082");
    this.electronService.relaunch();
  }
}
