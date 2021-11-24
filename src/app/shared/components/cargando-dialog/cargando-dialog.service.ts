import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { CargandoDialogComponent } from "./cargando-dialog.component";

@Injectable({
  providedIn: "root",
})
export class CargandoDialogService {
  dialogRef: MatDialogRef<any>;

  constructor(private matDialog: MatDialog) {}

  openDialog() {
    if (this.dialogRef == null) {
      this.dialogRef = this.matDialog.open(CargandoDialogComponent, {
        disableClose: false,
      });
    }
  }

  closeDialog() {
    if (this.dialogRef != null) this.dialogRef.close();
    this.dialogRef = null;
  }
}
