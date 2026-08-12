import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

export type EtiquetasAccion = "ticket" | "pdf";

export interface ImprimirEtiquetasDialogData {
  devolucionId: number;
  identificador: string;
  items: any[];
}

export interface ImprimirEtiquetasDialogResult {
  accion: EtiquetasAccion;
}

interface FilaVista {
  producto: string;
  cantidad: string;
  motivo: string;
}

/**
 * Diálogo de impresión de etiquetas de separado. Muestra qué se va a imprimir
 * (una etiqueta por ítem) y deja elegir ticket térmico o PDF A4.
 */
@Component({
  selector: "app-imprimir-etiquetas-dialog",
  templateUrl: "./imprimir-etiquetas-dialog.component.html",
  styleUrls: ["./imprimir-etiquetas-dialog.component.scss"],
})
export class ImprimirEtiquetasDialogComponent {
  columnas = ["producto", "cantidad", "motivo"];
  filas: FilaVista[] = [];

  constructor(
    private dialogRef: MatDialogRef<ImprimirEtiquetasDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImprimirEtiquetasDialogData
  ) {
    this.filas = (data?.items || []).map((it) => ({
      producto: it?.producto?.descripcion || "—",
      cantidad: this.textoCantidad(it),
      motivo: it?.motivoAveria?.descripcion || "—",
    }));
  }

  get cantidad(): number {
    return this.filas.length;
  }

  onTicket(): void {
    this.dialogRef.close({ accion: "ticket" } as ImprimirEtiquetasDialogResult);
  }

  onPdf(): void {
    this.dialogRef.close({ accion: "pdf" } as ImprimirEtiquetasDialogResult);
  }

  onCerrar(): void {
    this.dialogRef.close();
  }

  private textoCantidad(it: any): string {
    const cant = it?.cantidad ?? 0;
    const pres = it?.presentacion?.descripcion || "";
    const factor = it?.presentacion?.cantidad ?? 1;
    const base = cant * factor;
    return `${cant} ${pres} = ${base} UN`.trim();
  }
}
