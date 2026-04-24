import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Sucursal } from '../../../../../empresarial/sucursal/sucursal.model';

export interface SelectSucursalesDialogData {
  sucursalesInfluencia: Sucursal[];
  sucursalesEntrega: Sucursal[];
  sucursalesInfluenciaUsadas: number[];
  sucursalesEntregaUsadas: number[];
}

export interface SelectSucursalesDialogResult {
  sucursalInfluencia: Sucursal;
  sucursalEntrega: Sucursal;
}

@Component({
  selector: 'app-select-sucursales-dialog',
  template: `
    <h2 mat-dialog-title>Agregar Distribución</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Sucursal de Influencia</mat-label>
          <mat-select formControlName="sucursalInfluencia" required>
            <mat-option *ngFor="let sucursal of sucursalesInfluenciaDisponibles" [value]="sucursal">
              {{ sucursal.nombre }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('sucursalInfluencia')?.hasError('required')">
            Debe seleccionar una sucursal de influencia
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Sucursal de Entrega</mat-label>
          <mat-select formControlName="sucursalEntrega" required>
            <mat-option *ngFor="let sucursal of sucursalesEntregaDisponibles" [value]="sucursal">
              {{ sucursal.nombre }}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('sucursalEntrega')?.hasError('required')">
            Debe seleccionar una sucursal de entrega
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="!form.valid" (click)="onSave()">
        Agregar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 400px;
      padding: 20px;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    mat-dialog-actions {
      padding: 16px 24px;
    }
  `]
})
export class SelectSucursalesDialogComponent implements OnInit {
  form: FormGroup;
  sucursalesInfluenciaDisponibles: Sucursal[] = [];
  sucursalesEntregaDisponibles: Sucursal[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<SelectSucursalesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SelectSucursalesDialogData
  ) {
    this.form = this.formBuilder.group({
      sucursalInfluencia: [null, Validators.required],
      sucursalEntrega: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // Mostrar todas las sucursales disponibles en el pedido
    this.sucursalesInfluenciaDisponibles = this.data.sucursalesInfluencia || [];
    this.sucursalesEntregaDisponibles = this.data.sucursalesEntrega || [];

    // Si solo hay una opción disponible, seleccionarla automáticamente
    if (this.sucursalesInfluenciaDisponibles.length === 1) {
      this.form.get('sucursalInfluencia')?.setValue(this.sucursalesInfluenciaDisponibles[0]);
    }
    if (this.sucursalesEntregaDisponibles.length === 1) {
      this.form.get('sucursalEntrega')?.setValue(this.sucursalesEntregaDisponibles[0]);
    }
  }

  onSave(): void {
    if (this.form.valid) {
      const result: SelectSucursalesDialogResult = {
        sucursalInfluencia: this.form.get('sucursalInfluencia')?.value,
        sucursalEntrega: this.form.get('sucursalEntrega')?.value
      };
      this.dialogRef.close(result);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
