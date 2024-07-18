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

  private dialogRequests: Map<number, { timer: any, texto: string, botonText?: string, showCerrarButton: boolean, abortController: AbortController }> = new Map();
  private requestIdCounter: number = 0;

  public dialogSub: Subject<boolean> = new Subject<boolean>();

  constructor(
    private matDialog: MatDialog,
    private spinnerService: NgxSpinnerService,
    private notificacionService: NotificacionSnackbarService
  ) {}

  openDialog(disable?: boolean, texto?: string, duracion?: number, botonDelay?: number, botonText?: string): { requestId: number, signal: AbortSignal } {
    this.spinnerService.show();

    const requestId = this.requestIdCounter++;
    const abortController = new AbortController();
    const timer = setTimeout(() => {
      this.closeDialog(requestId);
      this.notificacionService.openWarn('Tiempo de espera superado');
    }, duracion || 60000); // Default duration 60 seconds

    this.dialogRequests.set(requestId, {
      timer,
      texto: texto || '',
      botonText: botonText || 'Cerrar',
      showCerrarButton: disable !== undefined ? !disable : true,
      abortController
    });
    // console.log(`Dialog opened: requestId=${requestId}, signal=${abortController.signal}`);
    return { requestId, signal: abortController.signal };
  }

  closeDialog(requestId?: number) {
    if (requestId === null || requestId === undefined) {
      // Close the next open dialog
      const nextRequestId = this.dialogRequests.keys().next().value;
      if (nextRequestId !== undefined) {
        requestId = nextRequestId;
      }
    }

    const request = this.dialogRequests.get(requestId);
    if (request) {
      clearTimeout(request.timer);
      request.abortController.abort();
      // console.log(`Request aborted: requestId=${requestId}`);
      this.dialogRequests.delete(requestId);

      if (this.dialogRequests.size === 0) {
        this.spinnerService.hide();
      }
    }
  }

  onShowCerrarButton(requestId: number) {
    const request = this.dialogRequests.get(requestId);
    if (request) {
      request.showCerrarButton = true;
      this.dialogRequests.set(requestId, request); // Update the entry
    }
  }
}
