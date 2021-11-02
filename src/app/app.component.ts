import { OverlayContainer } from "@angular/cdk/overlay";
import { Component, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MainService } from "./main.service";
import { LoginComponent } from "./modules/login/login.component";
import {
  NotificacionSnackbarData,
  NotificacionSnackbarService,
} from "./notificacion-snackbar.service";
import { WindowInfoService } from "./shared/services/window-info.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  title = "franco-dev-systems";
  innerWidth;
  innerHeight;

  constructor(
    private overlay: OverlayContainer,
    private windowInfo: WindowInfoService,
    private notificationService: NotificacionSnackbarService,
    private snackBar: MatSnackBar,
    private matDialog: MatDialog,
    public mainService: MainService
  ) {
    this.innerHeight = windowInfo.innerHeight + "px";
    notificationService.notification$.subscribe((res) => {
      let duracion = res.duracion != null ? res.duracion : 3;
      snackBar.open(res.texto, null, {
        horizontalPosition: "center",
        duration: res.duracion * 1000,
        verticalPosition: "top",
        panelClass: [res.color],
      });
    });
  }

  ngOnInit(): void {
    this.overlay.getContainerElement().classList.add("darkMode");
    this.matDialog.open(LoginComponent, {
      width: "500px",
      height: "500px",
      disableClose: false,
    });
  }
}
