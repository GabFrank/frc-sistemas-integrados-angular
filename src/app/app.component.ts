import { OverlayContainer } from "@angular/cdk/overlay";
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { GenericCrudService } from "./generics/generic-crud.service";
import { MainService } from "./main.service";
import { ElectronService } from "./commons/core/electron/electron.service";
import { ConfiguracionService } from "./shared/services/configuracion.service";
import { LoginComponent } from "./modules/login/login.component";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "./notificacion-snackbar.service";
import { CargandoDialogService } from "./shared/components/cargando-dialog/cargando-dialog.service";
import { WindowInfoService } from "./shared/services/window-info.service";
import { SearchBarDialogComponent } from "./shared/widgets/search-bar-dialog/search-bar-dialog.component";
import { DialogoNuevasFuncionesComponent } from "./shared/components/dialogo-nuevas-funciones/dialogo-nuevas-funciones.component";
import { GraphqlConnectionService, connectionStatusSub } from "./shared/services/graphql-connection.service";
import { ConfirmDialogComponent } from "./shared/components/confirm-dialog/confirm-dialog.component";
import { NotificacionesTableroService } from "./modules/notificaciones/services/notificaciones-tablero.service";
import { UpdateDialogComponent } from "./shared/components/update-dialog/update-dialog.component";

export class Pageable {
  getPageNumber: number;
  getPageSize: number;
}

export class PageInfo<T> {
  getTotalPages: number = 0;
  getTotalElements: number = 0;
  getNumberOfElements: number = 0;
  isFirst: boolean = true;
  isLast: boolean = true;
  hasNext: boolean = false;
  hasPrevious: boolean = false;
  getPageable: Pageable;
  getContent: T[] = [];
  getMultiPageableList?: [MultiPageable]
}

export class MultiPageable {
  tenantId: number;
  page: number;
  offset: number;
  totalElements: number;
  lastOffset: number;
  lastTotalElement: number;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild("container", { static: true }) container: ElementRef<any>;

  title = "franco-dev-systems";
  innerWidth;
  innerHeight;
  lastStatus = false;
  timer = null;
  snackBarRef: any;
  keyPressed: any;
  dialogRef;
  dialogCount = 0;
  cursorStyle = 'auto';

  constructor(
    private overlay: OverlayContainer,
    private windowInfo: WindowInfoService,
    private notificationService: NotificacionSnackbarService,
    private snackBar: MatSnackBar,
    private matDialog: MatDialog,
    public mainService: MainService,
    private electronService: ElectronService,
    public genericService: GenericCrudService,
    private configService: ConfiguracionService,
    public cargandoService: CargandoDialogService,
    private graphqlService: GraphqlConnectionService,
    private notificacionesTableroService: NotificacionesTableroService,
    private cdr: ChangeDetectorRef
  ) {
    this.innerHeight = windowInfo.innerHeight + "px";
    notificationService.notification$
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        let duracion = res.duracion != null ? res.duracion : 3;
        if (this.snackBarRef == null) {
          this.snackBarRef = snackBar.open(res.texto, null, {
            horizontalPosition: "center",
            duration: res.duracion * 1000,
            verticalPosition: "bottom",
            panelClass: res.color?.toString(),
          });
        }
        setTimeout(() => {
          this.snackBarRef = null;
        }, res.duracion * 1000);
      });
  }
  async ngOnInit(): Promise<void> {
    this.overlay.getContainerElement().classList.add("darkMode");
    this.startLoadingObserver();
    
    this.configService.configChanged
      .pipe(untilDestroyed(this))
      .subscribe(config => {
        this.graphqlService.reconnectWebSockets();
      });

    // Listen for update dialog open request from Electron menu
    try {
      const isElectron = window && typeof window['require'] === 'function';
      if (isElectron) {
        const { ipcRenderer } = window['require']('electron');
        ipcRenderer.on('open-update-dialog', () => {
          this.matDialog.open(UpdateDialogComponent, {
            width: '450px',
          });
        });
      }
    } catch (e) { }
    this.configService.isConfigured()
      .pipe(untilDestroyed(this))
      .subscribe((isSystemConfigured) => {
        if (!isSystemConfigured) {
          this.configService.showConfigDialog()
            .pipe(untilDestroyed(this))
            .subscribe((configured) => {
              if (configured) {
                this.notificationService.notification$.next({
                  texto: "CONFIGURACIÓN GUARDADA. INICIANDO APLICACIÓN...",
                  color: NotificacionColor.success,
                  duracion: 3
                });
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else {
                this.notificationService.notification$.next({
                  texto: "CONFIGURACIÓN NECESARIA PARA INICIAR EL SISTEMA",
                  color: NotificacionColor.warn,
                  duracion: 10
                });
              }
            });
        } else {
          if (!this.configService.hasUserConfiguration()) {
            this.configService.showConfigDialog()
              .pipe(untilDestroyed(this))
              .subscribe((configured) => {
                if (configured) {
                  this.notificationService.notification$.next({
                    texto: "CONFIGURACIÓN GUARDADA. INICIANDO APLICACIÓN...",
                    color: NotificacionColor.success,
                    duracion: 3
                  });
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                } else {
                  this.notificationService.notification$.next({
                    texto: "USANDO CONFIGURACIÓN POR DEFECTO",
                    color: NotificacionColor.info,
                    duracion: 5
                  });
                  this.initializeApp();
                }
              });
          } else {
            this.initializeApp();
          }
        }
      });

    connectionStatusSub.pipe(untilDestroyed(this)).subscribe((res) => {
      if (res == true) {
        this.notificationService.notification$.next({
          texto: "Servidor Online!!",
          color: NotificacionColor.success,
          duracion: 6,
        });
        clearInterval(this.timer);
      } else if (res == false) {
        this.timer = setInterval(() => {
          this.notificationService.notification$.next({
            texto: "Servidor Offline!!",
            color: NotificacionColor.danger,
            duracion: 1,
          });
        }, 3000);
      }
    });
  }
  private initializeApp(): void {
    this.mainService.load();
    if (this.electronService && this.electronService.isElectron) {
      this.electronService.initPushNotifications((token) => {
        if (token) {
          this.notificacionesTableroService.setTokenFcm(token);
        }
      });
    } else {
    }
    this.matDialog
      .open(LoginComponent, {
        width: "80%",
        maxWidth: "900px",
        disableClose: true,
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res) {
          this.notificationService.notification$.next({
            texto: "POR FAVOR CONFIGURE LOS PARÁMETROS DEL SERVIDOR PARA CONTINUAR",
            color: NotificacionColor.info,
            duracion: 5
          });

          this.configService
            .showConfigDialog()
            .pipe(untilDestroyed(this))
            .subscribe(configured => {
              if (configured) {
                const confirmDialogRef = this.matDialog.open(ConfirmDialogComponent, {
                  width: '400px',
                  data: {
                    title: 'REINICIAR APLICACIÓN',
                    message: 'LA CONFIGURACIÓN HA SIDO GUARDADA. ES NECESARIO REINICIAR LA APLICACIÓN PARA APLICAR LOS CAMBIOS. ¿DESEA REINICIAR AHORA?',
                    confirmText: 'REINICIAR',
                    cancelText: 'DESPUÉS'
                  }
                });

                confirmDialogRef.afterClosed().subscribe(restart => {
                  if (restart) {
                    this.notificationService.notification$.next({
                      texto: "REINICIANDO APLICACIÓN...",
                      color: NotificacionColor.info,
                      duracion: 3
                    });

                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  } else {
                    this.graphqlService.reconnectWebSockets();
                    setTimeout(() => {
                      this.matDialog.open(LoginComponent, {
                        width: "80%",
                        maxWidth: "800px",
                        disableClose: true,
                      });
                    }, 1000);
                  }
                });
              }
            });
        }
      });
  }

  @HostListener("document:keydown", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case "Control":
        this.keyPressed = "Control";
        break;
      case " ":
        if (this.keyPressed == "Control" && this.matDialog.openDialogs.length === 0)
          this.matDialog.open(SearchBarDialogComponent, {
            data: null,
            width: "50%",
          });
        break;
      default:
        break;
    }
  }

  @HostListener("document:keyup", ["$event"]) onKeyupHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case "Control":
        this.keyPressed = null;
        break;
      case "Enter":
        break;
      default:
        break;
    }
  }

  ngOnDestroy(): void {
  }

  /**
   * Observa cambios en genericService.isLoading y actualiza la propiedad local
   * Usa setInterval para evitar ExpressionChangedAfterItHasBeenCheckedError
   */
  private startLoadingObserver(): void {
    setInterval(() => {
      const newCursorStyle = this.genericService.isLoading ? 'progress' : 'auto';
      if (this.cursorStyle !== newCursorStyle) {
        this.cursorStyle = newCursorStyle;
        this.cdr.detectChanges();
      }
    }, 100);
  }

  onCerrarCargando() {
    this.cargandoService.closeAll();
  }
}
