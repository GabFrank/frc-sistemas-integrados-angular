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
      .subscribe((isConfigured) => {
        if (!isConfigured) {
          // If not configured, show configuration dialog
          this.configService.showConfigDialog()
            .pipe(untilDestroyed(this))
            .subscribe((configured) => {
              if (configured) {
                // Configuration saved, continue with app initialization
                this.initializeApp();
              } else {
                // User cancelled configuration, show message
                this.notificationService.notification$.next({
                  texto: "Configuración necesaria para iniciar el sistema",
                  color: NotificacionColor.warn,
                  duracion: 10
                });
              }
            });
        } else {
          // System is configured, proceed with normal initialization
          this.initializeApp();
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
        width: "70%",
        disableClose: false,
      })
      .afterClosed()
      .subscribe((res) => {
        if (!res) {
          console.log("Login failed or was cancelled, showing configuration dialog");
          // If login fails or is cancelled, check if server configuration needs to be updated
          this.notificationService.notification$.next({
            texto: "Por favor configure los parámetros del servidor para continuar",
            color: NotificacionColor.info,
            duracion: 5
          });
          
          this.configService
            .showConfigDialog()
            .pipe(untilDestroyed(this))
            .subscribe(configured => {
              if (configured) {
                // If configuration was updated, attempt to reconnect
                this.graphqlService.reconnectWebSockets();
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
