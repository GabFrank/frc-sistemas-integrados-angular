import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxSpinnerService } from "ngx-spinner";
import { BehaviorSubject, map, Observable, Subject, timer } from "rxjs";
import { CargandoDialogComponent } from "./cargando-dialog.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { TIMEOUT_POR_DEFECTO_MS } from "../../services/timeout-link";

class DialogData {
  texto: string;
  id: number;
}

@UntilDestroy({ checkProperties: true })
@Injectable({
  providedIn: "root",
})
export class CargandoDialogService {
  private dialogRequests: Map<
    number,
    {
      timer: any;
      texto: string;
      botonText?: string;
      showCerrarButton: boolean;
    }
  > = new Map();
  public requestIdCounter: number = 0;

  public dialogSub: Subject<boolean> = new Subject<boolean>();

  constructor(
    private matDialog: MatDialog,
    private spinnerService: NgxSpinnerService
  ) {

  }

  openDialog(
    disable?: boolean,
    texto?: string,
    duracion?: number,
    botonDelay?: number,
    botonText?: string
  ): { requestId: number } {
    // console.trace('Method called');

    this.spinnerService.show();

    const requestId = this.requestIdCounter++;
    // Red de seguridad: cierra el spinner si nadie lo cierra. No avisa ni corta la request: el
    // corte real y su aviso son del timeout link de GraphQL, que vence antes (issue #304).
    const timer = setTimeout(() => {
      this.closeDialog(requestId);
    }, duracion || TIMEOUT_POR_DEFECTO_MS + 5000);

    this.dialogRequests.set(requestId, {
      timer,
      texto: texto || "",
      botonText: botonText || "Cerrar",
      showCerrarButton: disable !== undefined ? !disable : true,
    });
    return { requestId };
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

  getRequestIdCounter(): number {
    return this.requestIdCounter;
  }

  closeAll() {
    this.dialogRequests.forEach((request) => {
      clearTimeout(request.timer);
    });
    this.dialogRequests.clear();
    this.spinnerService.hide();
    this.dialogSub.next(false);
    this.dialogSub.complete();
  }

  public dialogState$(): Observable<boolean> {
    return this.spinnerService.spinnerObservable.pipe(
      map(res => !!res?.show) // Use `map` to transform the value into a boolean
    );
  }
}
