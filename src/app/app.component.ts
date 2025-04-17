import { OverlayContainer } from "@angular/cdk/overlay";
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { GenericCrudService } from "./generics/generic-crud.service";
import { MainService } from "./main.service";
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

  constructor(
    private overlay: OverlayContainer,
    private windowInfo: WindowInfoService,
    private notificationService: NotificacionSnackbarService,
    private snackBar: MatSnackBar,
    private matDialog: MatDialog,
    public mainService: MainService,
    public genericService: GenericCrudService,
    private configService: ConfiguracionService,
    public cargandoService: CargandoDialogService,
    private graphqlService: GraphqlConnectionService
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

    // cargandoService.dialogSub
    //   .pipe(untilDestroyed(this))
    //   .subscribe(res => {
    //     if(res){
    //       this.dialogCount++;
    //       if(this.dialogCount == 1){
    //         this.dialogRef = this.matDialog.open(CargandoDialogComponent, {
    //           disableClose: true,
    //         });
    //       }
    //     } else {
    //       this.dialogCount--;
    //       if(this.dialogCount == 0 && this.dialogRef!=null){
    //         this.dialogRef.close()
    //         this.dialogRef = null;
    //       }
    //     }
    //   })
  }

  /**
   * 1 - se adiciona la clase darkMode al container principal, para poder aplicar el estilo dark
   * 2 - Verificamos la configuración y mostramos el diálogo si es necesario
   * 3 - Inicializamos la aplicación y abrimos el diálogo de login
   */
  async ngOnInit(): Promise<void> {
    console.log("on init de la app");
    console.log("Cargando configuración: verificando localStorage, archivo de backup y configuración por defecto");

    this.overlay.getContainerElement().classList.add("darkMode");
    
    // Subscribe to configuration changes to trigger connection updates
    this.configService.configChanged
      .pipe(untilDestroyed(this))
      .subscribe(config => {
        console.log('Configuration changed - attempting to reconnect');
        this.graphqlService.reconnectWebSockets();
      });
    
    // Check if system is configured
    this.configService.isConfigured()
      .pipe(untilDestroyed(this))
      .subscribe((isSystemConfigured) => {
        if (!isSystemConfigured) {
          // If not configured, show configuration dialog
          this.configService.showConfigDialog()
            .pipe(untilDestroyed(this))
            .subscribe((configured) => {
              if (configured) {
                // Configuration saved, restart to ensure proper initialization
                this.notificationService.notification$.next({
                  texto: "CONFIGURACIÓN GUARDADA. INICIANDO APLICACIÓN...",
                  color: NotificacionColor.success,
                  duracion: 3
                });
                
                // Delay restart slightly to show notification
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              } else {
                // User cancelled configuration, show message
                this.notificationService.notification$.next({
                  texto: "CONFIGURACIÓN NECESARIA PARA INICIAR EL SISTEMA",
                  color: NotificacionColor.warn,
                  duracion: 10
                });
              }
            });
        } else {
          // Check if user has explicitly configured the system
          if (!this.configService.hasUserConfiguration()) {
            // If using default config (not explicitly configured by user), show config dialog first
            this.configService.showConfigDialog()
              .pipe(untilDestroyed(this))
              .subscribe((configured) => {
                if (configured) {
                  // User has configured the system, restart to ensure proper initialization
                  this.notificationService.notification$.next({
                    texto: "CONFIGURACIÓN GUARDADA. INICIANDO APLICACIÓN...",
                    color: NotificacionColor.success,
                    duracion: 3
                  });
                  
                  // Delay restart slightly to show notification
                  setTimeout(() => {
                    window.location.reload();
                  }, 1500);
                } else {
                  // User cancelled configuration, proceed with default settings
                  this.notificationService.notification$.next({
                    texto: "USANDO CONFIGURACIÓN POR DEFECTO",
                    color: NotificacionColor.info,
                    duracion: 5
                  });
                  // Initialize with default config
                  this.initializeApp();
                }
              });
          } else {
            // System is configured and user has explicitly configured it, proceed with normal initialization
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

  /**
   * Initialize the application after configuration is loaded
   */
  private initializeApp(): void {
    // Load main service data
    this.mainService.load();
    
    // Open login dialog
    this.matDialog
      .open(LoginComponent, {
        width: "80%",
        maxWidth: "900px",
        disableClose: true,
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res) {
          console.log("Login failed or was cancelled, showing configuration dialog");
          // If login fails or is cancelled, check if server configuration needs to be updated
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
                // If configuration was updated, prompt for restart
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
                    // Restart the application
                    this.notificationService.notification$.next({
                      texto: "REINICIANDO APLICACIÓN...",
                      color: NotificacionColor.info,
                      duracion: 3
                    });
                    
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  } else {
                    // Just attempt to reconnect without restart
                    this.graphqlService.reconnectWebSockets();
                    
                    // After updating config, reopen login dialog
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
        if (this.keyPressed == "Control")
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
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
  }

  onCerrarCargando() {
    this.cargandoService.closeAll();
  }
}
