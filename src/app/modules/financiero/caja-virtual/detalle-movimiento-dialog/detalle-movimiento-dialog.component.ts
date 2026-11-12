import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Un dato del movimiento: etiqueta y valor ya formateado. */
export interface DatoDetalle { etiqueta: string; valor: string; }

export interface DetalleMovimientoDialogData {
  titulo: string;
  subtitulo?: string;
  datos: DatoDetalle[];
}

/**
 * Detalle simple de un movimiento sin pantalla propia (manual o anulación, desk #721): descripción, usuario, fecha y,
 * si está anulado, quién y por qué. Los datos los arma quien lo abre: acá solo se muestran.
 */
@Component({
  selector: 'app-detalle-movimiento-dialog',
  templateUrl: './detalle-movimiento-dialog.component.html',
  styleUrls: ['./detalle-movimiento-dialog.component.scss'],
})
export class DetalleMovimientoDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DetalleMovimientoDialogData) {}
}
