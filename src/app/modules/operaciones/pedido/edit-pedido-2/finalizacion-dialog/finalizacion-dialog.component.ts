import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface FinalizacionDialogData {
  titulo: string;
  proveedor: any;
  vendedor: any;
  formaPago: any;
  cantidadItems: number;
  totalValue: number;
  monedaSymbol: string;
}

export interface FinalizacionDialogResult {
  confirmed: boolean;
}

@Component({
  selector: 'app-finalizacion-dialog',
  templateUrl: './finalizacion-dialog.component.html',
  styleUrls: ['./finalizacion-dialog.component.scss']
})
export class FinalizacionDialogComponent implements OnInit {

  // Computed properties for template usage
  monedaDisplayValue = '';

  constructor(
    public dialogRef: MatDialogRef<FinalizacionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FinalizacionDialogData
  ) {}

  ngOnInit(): void {
    this.setupComputedProperties();
  }

  private setupComputedProperties(): void {
    this.monedaDisplayValue = `${this.data.totalValue.toLocaleString('es-PY')} ${this.data.monedaSymbol}`;
  }

  onConfirm(): void {
    this.dialogRef.close({ confirmed: true } as FinalizacionDialogResult);
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false } as FinalizacionDialogResult);
  }
} 