import { Component, Inject, OnInit } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DevolucionDialogComponent } from "../garantia-devolucion/devolucion-dialog/devolucion-dialog.component";
import { GarantiaDialogComponent } from "../garantia-devolucion/garantia-dialog/garantia-dialog.component";

@Component({
  selector: "app-garantia-devolucion-dialog",
  templateUrl: "./garantia-devolucion-dialog.component.html",
  styleUrls: ["./garantia-devolucion-dialog.component.scss"],
})
export class GarantiaDevolucionDialogComponent implements OnInit {


  constructor(
    private dialogRef: MatDialogRef<GarantiaDevolucionDialogComponent>,
    private matDialog: MatDialog
  ) {
  }

  ngOnInit(): void {

  }

  onEnvaseClick() {
    this.matDialog.open(GarantiaDialogComponent, {
    })
  }

  onProductoClick() {
    this.matDialog.open(DevolucionDialogComponent)
  }
}
