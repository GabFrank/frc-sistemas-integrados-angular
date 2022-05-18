import { Injectable } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { BehaviorSubject } from "rxjs";
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


  constructor(private matDialog: MatDialog) {
  }

  openDialog(disable?: boolean, texto?: string) {
      // this.dialogRef = this.matDialog.open(CargandoDialogComponent, {
      //   disableClose: disable,
      // });    
    // console.log('abriendo dialog')
    // this.cargandoTextSub.next(texto)
    this.dialogCount++;
    // if(disable==null) disable = false;
    if (this.dialogCount == 0) {
      this.dialogRef = this.matDialog.open(CargandoDialogComponent, {
        disableClose: disable,
      });
    }
  }

  closeDialog() {
    // console.log('cerrando dialog')
    this.dialogCount--;
    if(this.dialogCount == 0 && this.dialogRef!=null){
      this.dialogRef.close()
    }
  }
}
