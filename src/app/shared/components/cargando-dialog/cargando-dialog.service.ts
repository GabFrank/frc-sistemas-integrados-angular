import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxSpinnerService } from "ngx-spinner";
import { BehaviorSubject, Subject, timer } from "rxjs";
import { CargandoDialogComponent } from "./cargando-dialog.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { NotificacionSnackbarService } from "../../../notificacion-snackbar.service";

class DialogData {
  texto: string
  id: number
}

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class CargandoDialogService {

  cargandoTextSub = new BehaviorSubject<string>(null);
  dialogCount = 0;
  dialogRef: MatDialogRef<any>;

  public dialogSub: Subject<boolean> = new Subject<boolean>();

  constructor(
    private matDialog: MatDialog,
    private spinnerService: NgxSpinnerService,
    private notificacionService: NotificacionSnackbarService
  ) {
  }

  openDialog(disable?: boolean, texto?: string, duracion?: number) {
    this.dialogCount++;
    this.spinnerService.show()

    if (duracion != null) {
      setTimeout(() => {
        if (this.dialogCount > 0) {
          this.closeDialog()
          this.notificacionService.openWarn('Tiempo de espera superado')
        }
      }, duracion);
    }
  }

  closeDialog() {
    setTimeout(() => {
      if (this.dialogCount > 1) {
        this.dialogCount--;
      } else if (this.dialogCount == 1) {
        this.dialogCount--;
        this.spinnerService.hide()
      }
    }, 500);
  }
}
