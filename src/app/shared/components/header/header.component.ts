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
import { Observable, Subscription, timer } from "rxjs";
import { map } from "rxjs/operators";
import { ElectronService } from "../../../commons/core/electron/electron.service";
import { TabService } from "../../../layouts/tab/tab.service";
import { MainService } from "../../../main.service";
import { LoginDialogService } from "../../services/login-dialog.service";
import { CargandoDialogService } from "../cargando-dialog/cargando-dialog.service";
import { LoginService } from "./../../../modules/login/login.service";
import { SearchBarDialogComponent } from "./../../widgets/search-bar-dialog/search-bar-dialog.component";

import { isDevMode } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { environment } from "../../../../environments/environment";
import { TipoEntidad } from "../../../generics/tipo-entidad.enum";
import { ActualizacionService } from "../../../modules/configuracion/actualizacion/actualizacion.service";
import { ConfiguracionService } from "../../services/configuracion.service";
import { ROLES } from "../../../modules/personas/roles/roles.enum";
import { QrCodeComponent, QrData } from "../../qr-code/qr-code.component";
import { DialogosService } from "../dialogos/dialogos.service";
import { UsuarioService } from "../../../modules/personas/usuarios/usuario.service";
import { InicioSesion } from "../../../modules/configuracion/models/inicio-sesion.model";
import { connectionStatusSub, cloudConnectionStatusSub } from "../../services/graphql-connection.service";
import { NotificacionesTableroService } from "../../../modules/notificaciones/services/notificaciones-tablero.service";
import { CotizacionHeaderService } from "../../services/cotizacion-header.service";

/** Hora/fecha del reloj del header: siempre reloj local del SO (no servidor). */
export interface HeaderClockNow {
  time: string;
  date: string;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isDev = isDevMode();
  isLocalhost = false;
  isLocal = true;
  localStatus = false;
  cloudStatus = false;
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
  @Output() openNotificationsEvent: EventEmitter<void> = new EventEmitter<void>();
  appVersion = null;
  unreadCount$ = this.notificacionesTableroService.unreadCount$;
  cotizaciones$ = this.cotizacionHeaderService.cotizaciones$;
  /** Reloj local: útil para detectar si la zona horaria del equipo cambió. */
  now$ = timer(0, 1000).pipe(map(() => HeaderComponent.formatRelojLocal(new Date())));
  userMainRole = '';
  isRefreshingCotiz = false;

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
    private usuarioService: UsuarioService,
    private loginDialogService: LoginDialogService,
    private notificacionesTableroService: NotificacionesTableroService,
    private cotizacionHeaderService: CotizacionHeaderService
  ) {
    setTimeout(() => {
      console.log(this.mainService.usuarioActual);
    }, 2000);
  }

  /**
   * Electron 24 embebe ICU con DST obsoleto en `America/Asuncion` (UTC−4 en mayo).
   * El SO y `date` en terminal usan UTC−3 fijo; `getHours()` en el renderer queda 1 h atrás.
   */
  private static readonly DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  private static readonly MESES_CORTOS = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  /** Minutos al este de UTC según el SO; corrige el bug UTC−4 de Electron en Paraguay. */
  private static offsetMinutosLocalCorregido(d: Date): number {
    let offsetMinEste = -d.getTimezoneOffset();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "America/Asuncion" && offsetMinEste === -240) {
      offsetMinEste = -180;
    }
    return offsetMinEste;
  }

  private static formatRelojLocal(d: Date): HeaderClockNow {
    const offsetMinEste = HeaderComponent.offsetMinutosLocalCorregido(d);
    const local = new Date(d.getTime() + offsetMinEste * 60 * 1000);
    const time = [local.getUTCHours(), local.getUTCMinutes(), local.getUTCSeconds()]
      .map((n) => String(n).padStart(2, "0"))
      .join(":");

    const date = `${HeaderComponent.DIAS_CORTOS[local.getUTCDay()]} ${local.getUTCDate()} ${
      HeaderComponent.MESES_CORTOS[local.getUTCMonth()]
    }.`;

    return { time, date };
  }

  ngOnInit(): void {
    const config = this.configService.getConfig();
    this.isLocalhost = config.serverIp === "localhost";
    this.isLocal = config.isLocal;
    this.configChangedSub = this.configService.configChanged
      .pipe(untilDestroyed(this))
      .subscribe(newConfig => {
        this.isLocal = newConfig.isLocal;
        this.isLocalhost = newConfig.serverIp === "localhost";
        this.updateServerWarning();
      });
    this.localStatusSub = connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.localStatus = res;
        this.updateServerWarning();
      });
    this.cloudStatusSub = cloudConnectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.cloudStatus = res;
        this.updateServerWarning();
      });
    this.sucursalList = environment["sucursales"] || [];

    this.appVersion = this.electronService.getAppVersion();

    const tokenFcm = localStorage.getItem("pushToken");
    if (tokenFcm && this.mainService.usuarioActual) {
      this.notificacionesTableroService.setTokenFcm(tokenFcm);
    }

    this.mainService.authenticationSub
      .pipe(untilDestroyed(this))
      .subscribe((authenticated) => {
        if (authenticated) {
          const tokenFcm = localStorage.getItem("pushToken");
          if (tokenFcm) {
            this.notificacionesTableroService.setTokenFcm(tokenFcm);
          }
          this.refreshUserChip();
        } else {
          this.userMainRole = '';
        }
      });
    this.refreshUserChip();
  }

  private refreshUserChip(): void {
    const roles = this.mainService?.usuarioActual?.roles || [];
    this.userMainRole = roles.length ? String(roles[0]).toUpperCase() : '';
  }
  private updateServerWarning(): void {
    if (this.cloudStatus != null) {
      if (this.isLocal && this.localStatus != null) {
        this.serverWarning = (this.localStatus && !this.cloudStatus) || (!this.localStatus && this.cloudStatus);
      } else {
        this.serverWarning = !this.cloudStatus;
      }
    } else {
      this.serverWarning = false;
    }
  }

  toogleSideBar() {
    this.toogleSideBarEvent.emit();
  }

  onOpenNotifications() {
    this.openNotificationsEvent.emit();
  }

  async onLogout() {
    let inicioSesion = new InicioSesion();
    Object.assign(inicioSesion, this.mainService.usuarioActual.inicioSesion);
    inicioSesion.horaFin = new Date();
    if (inicioSesion != null && inicioSesion?.sucursal != null) {
      await new Promise((resolve, rejects) => {
        this.usuarioService
          .onSaveInicioSesion(inicioSesion.toInput())
          .subscribe((res) => {
            resolve(res);
          });
      });
    }
    this.mainService.logout();
    this.tabService.removeAllTabs();
    this.loginDialogService.openLoginDialog();
  }

  onLogin() {
    this.electronService.relaunch();
  }

  ngOnDestroy(): void {
    this.localStatusSub.unsubscribe();
    if (this.cloudStatusSub) {
      this.cloudStatusSub.unsubscribe();
    }
    if (this.configChangedSub) {
      this.configChangedSub.unsubscribe();
    }
  }

  onRefreshCotizacion() {
    if (this.isRefreshingCotiz) return;
    this.isRefreshingCotiz = true;
    this.cotizacionHeaderService.refresh();
    setTimeout(() => (this.isRefreshingCotiz = false), 1500);
  }

  onSearch() {
    this.matDialog.open(SearchBarDialogComponent, {
      data: null,
      width: "50%",
    });
  }

  removeServer() {
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
      .subscribe((res) => { });
  }
  openConfigDialog() {
    this.configService
      .showConfigDialog()
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (result) {
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
