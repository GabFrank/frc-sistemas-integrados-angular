import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ImprimirDialogData {
  /** Si true, solo ofrece PDF (sin ticket). */
  soloPdf?: boolean;
  titulo?: string;
}

export interface ImprimirDialogResult {
  formato: 'pdf' | 'ticket';
  /** null = PDF A4; 58 / 80 = ancho de ticket en mm. */
  anchoMm: number | null;
}

/**
 * Componente OFICIAL de impresión del sistema. Pregunta el formato de salida:
 * PDF (A4) o Ticket (58/80mm). Devuelve { formato, anchoMm } para que el caller
 * genere el documento en el ancho elegido y lo muestre en el visor integrado.
 * Padrón: usarlo en toda opción de impresión de comprobantes/recibos. Los
 * reportes agregados van solo PDF (no usan este diálogo, o lo abren con soloPdf).
 */
@Component({
  selector: 'app-imprimir-dialog',
  templateUrl: './imprimir-dialog.component.html',
  styleUrls: ['./imprimir-dialog.component.scss'],
})
export class ImprimirDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ImprimirDialogData,
    private dialogRef: MatDialogRef<ImprimirDialogComponent>
  ) {}

  elegir(formato: 'pdf' | 'ticket', anchoMm: number | null): void {
    this.dialogRef.close({ formato, anchoMm } as ImprimirDialogResult);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
