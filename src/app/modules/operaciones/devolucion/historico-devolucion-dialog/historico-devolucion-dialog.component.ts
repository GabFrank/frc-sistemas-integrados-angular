import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

export type HistoricoDevolucionOpcion = "devoluciones" | "colectas" | "retiros";

export interface HistoricoDevolucionDialogResult {
  opcion: HistoricoDevolucionOpcion;
}

/**
 * Selector de qué histórico abrir: devoluciones individuales, colectas internas
 * o retiros a proveedor. Devuelve la opción elegida vía dialogRef.close.
 */
@Component({
  selector: "app-historico-devolucion-dialog",
  templateUrl: "./historico-devolucion-dialog.component.html",
  styleUrls: ["./historico-devolucion-dialog.component.scss"],
})
export class HistoricoDevolucionDialogComponent {
  constructor(private dialogRef: MatDialogRef<HistoricoDevolucionDialogComponent>) {}

  onSeleccionar(opcion: HistoricoDevolucionOpcion): void {
    this.dialogRef.close({ opcion } as HistoricoDevolucionDialogResult);
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
