import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ProductoDuplicadoDialogData {
  descripcion: string;
}

@Component({
  selector: 'app-producto-duplicado-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Atención</h2>
    <mat-dialog-content>
      <p>Ya existe un producto con el nombre:</p>
      <p><strong>{{ data?.descripcion }}</strong></p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close cdkFocusInitial>Aceptar</button>
    </mat-dialog-actions>
  `,
})
export class ProductoDuplicadoDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProductoDuplicadoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductoDuplicadoDialogData
  ) {}
}
