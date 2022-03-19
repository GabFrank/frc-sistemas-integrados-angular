import { OverlayContainer } from "@angular/cdk/overlay";
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subscription } from "rxjs";
import { last } from "rxjs/operators";
import { connectionStatusSub } from "./app.module";
import { GenericCrudService } from "./generics/generic-crud.service";
import { MainService } from "./main.service";
import { LoginComponent } from "./modules/login/login.component";
import {
  NotificacionColor,
  NotificacionSnackbarData,
  NotificacionSnackbarService,
} from "./notificacion-snackbar.service";
import { WindowInfoService } from "./shared/services/window-info.service";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ConfigurarServidorDialogComponent } from "./modules/configuracion/configurar-servidor-dialog/configurar-servidor-dialog.component";

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

  constructor(
    private overlay: OverlayContainer,
    private windowInfo: WindowInfoService,
    private notificationService: NotificacionSnackbarService,
    private snackBar: MatSnackBar,
    private matDialog: MatDialog,
    public mainService: MainService,
    public genericService: GenericCrudService
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
            verticalPosition: "top",
            panelClass: [res.color],
          });
        }
        setTimeout(() => {
          this.snackBarRef = null;
        }, res.duracion * 1000);
      });
  }

  ngOnInit(): void {
    this.overlay.getContainerElement().classList.add("darkMode");
    this.matDialog.open(LoginComponent, {
      width: "500px",
      height: "500px",
      disableClose: true,
    }).afterClosed().subscribe(res => {
      if(!res){
        this.matDialog.open(ConfigurarServidorDialogComponent, {
          width: "80%",
          height: "500px",
          disableClose: true
        }).afterClosed().subscribe(res => {
          if(res){

          } else {
            this.ngOnInit()
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
        console.log("entro al false");
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

  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
  }
}
