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
import { connectionStatusSub } from "./app.module";
import { GenericCrudService } from "./generics/generic-crud.service";
import { MainService } from "./main.service";
import { ConfiguracionService } from "./modules/configuracion/configuracion.service";
import { ConfigurarServidorDialogComponent } from "./modules/configuracion/configurar-servidor-dialog/configurar-servidor-dialog.component";
import { LoginComponent } from "./modules/login/login.component";
import {
  NotificacionColor,
  NotificacionSnackbarService,
} from "./notificacion-snackbar.service";
import { CargandoDialogService } from './shared/components/cargando-dialog/cargando-dialog.service';
import { WindowInfoService } from "./shared/services/window-info.service";
import { SearchBarDialogComponent } from './shared/widgets/search-bar-dialog/search-bar-dialog.component';
import { DialogoNuevasFuncionesComponent } from "./shared/components/dialogo-nuevas-funciones/dialogo-nuevas-funciones.component";

export class Pageable {
  getPageNumber: number;
  getPageSize: number;
}

export class PageInfo<T> {
  getTotalPages: number;
  getTotalElements: number;
  getNumberOfElements: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  getPageable: Pageable;
  getContent: T[];
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
    public cargandoService: CargandoDialogService
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
            panelClass: res.color?.toString()
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
   * 1 - se adiciona la clase darkMode al conntainer principal, para poder aplicar el estilo dark
   * 2 - Abrimos el dialogo de login, si la respuesta es true el dialogo desaparece
   *    si la respuesta es false, abre el dialogo de configuracion de servidor
   */
  ngOnInit(): void {

    this.overlay.getContainerElement().classList.add("darkMode");
    this.matDialog.open(LoginComponent, {
      width: "70%",
      disableClose: false,
    }).afterClosed().subscribe(res => {
      if (!res) {
        this.configService.isConfigured()
          .pipe(untilDestroyed(this))
          .subscribe(res => {
            if (!res) {
              this.matDialog.open(ConfigurarServidorDialogComponent, {
                width: "80%",
                height: "500px",
                disableClose: true
              })
            }
          })
      }
    });

    connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
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

  @HostListener("document:keydown", ["$event"]) onKeydownHandler(
    event: KeyboardEvent
  ) {
    switch (event.key) {
      case "Control":
        this.keyPressed = 'Control'
        break;
      case " ":
        if (this.keyPressed == 'Control')
          this.matDialog.open(SearchBarDialogComponent, {
            data: null,
            width: '50%'
          })
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
}
