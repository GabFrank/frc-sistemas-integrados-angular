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



  constructor(private matDialog: MatDialog, private spinner: NgxSpinnerService) {
  }

  openDialog(disable?: boolean, texto?: string) {
    this.dialogCount++;
    if (this.dialogCount == 1) {
      this.spinner.show(texto)
    }
  }

  closeDialog() {
    this.dialogCount--;
    if (this.dialogCount == 0) {
      setTimeout(() => {
        this.spinner.hide()
      }, 500);
    }
  }
}
