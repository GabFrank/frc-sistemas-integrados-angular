import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { NgxSpinnerService } from "ngx-spinner";
import { BehaviorSubject, Subject } from "rxjs";
import { CargandoDialogComponent } from "./cargando-dialog.component";

class DialogData {
  texto: string
  id: number
}

@Injectable({
  providedIn: "root",
})
export class CargandoDialogService {

  cargandoTextSub = new BehaviorSubject<string>(null);
  dialogCount = 0;
  dialogRef: MatDialogRef<any>;

  public dialogSub: Subject<boolean> = new Subject<boolean>();



  constructor(private matDialog: MatDialog, private spinnerService: NgxSpinnerService) {
  }

  openDialog(disable?: boolean, texto?: string) {
    this.dialogCount++;
    this.spinnerService.show()
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
