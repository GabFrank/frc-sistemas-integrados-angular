import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

export interface CancelarDevolucionDialogResult {
  motivo: string | null;
}

/** Captura el motivo (opcional) al cancelar una devolución. */
@Component({
  selector: "app-cancelar-devolucion-dialog",
  templateUrl: "./cancelar-devolucion-dialog.component.html",
})
export class CancelarDevolucionDialogComponent {
  motivo = "";

  constructor(private dialogRef: MatDialogRef<CancelarDevolucionDialogComponent>) {}

  onConfirmar(): void {
    const m = this.motivo?.trim();
    this.dialogRef.close({
      motivo: m ? m.toUpperCase() : null,
    } as CancelarDevolucionDialogResult);
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
