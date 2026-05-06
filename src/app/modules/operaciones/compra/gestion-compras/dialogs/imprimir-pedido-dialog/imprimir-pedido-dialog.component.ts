import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export type ImprimirPedidoAccion = 'ticket' | 'pdf-inapp' | 'pdf-guardar';

export interface ImprimirPedidoDialogData {
  pedidoId: number;
  pedidoNro: number;
}

export interface ImprimirPedidoDialogResult {
  accion: ImprimirPedidoAccion;
}

@Component({
  selector: 'app-imprimir-pedido-dialog',
  templateUrl: './imprimir-pedido-dialog.component.html',
  styleUrls: ['./imprimir-pedido-dialog.component.scss']
})
export class ImprimirPedidoDialogComponent {

  constructor(
    private dialogRef: MatDialogRef<ImprimirPedidoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImprimirPedidoDialogData
  ) {}

  onSeleccionar(accion: ImprimirPedidoAccion): void {
    this.dialogRef.close({ accion } as ImprimirPedidoDialogResult);
  }

  onCancelar(): void {
    this.dialogRef.close();
  }
}
