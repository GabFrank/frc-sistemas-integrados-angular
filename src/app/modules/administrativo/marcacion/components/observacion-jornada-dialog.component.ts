import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-observacion-jornada-dialog',
  template: `
    <div style="padding: 20px; min-width: 400px; background-color: #2c2c2c; color: white;">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      <mat-dialog-content>
        <mat-form-field appearance="outline" style="width: 100%">
          <mat-label>Observación</mat-label>
          <textarea matInput [formControl]="observacionControl" rows="4" style="color: white;"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancelar()">Cancelar</button>
        <button mat-flat-button color="primary" (click)="onGuardar()" [disabled]="data.required && !observacionControl.value">Guardar</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    mat-form-field {
      margin-top: 10px;
    }
  `]
})
export class ObservacionJornadaDialogComponent implements OnInit {
  observacionControl = new FormControl('');

  constructor(
    public dialogRef: MatDialogRef<ObservacionJornadaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { title: string, observacion: string, required: boolean }
  ) { }

  ngOnInit(): void {
    if (this.data.observacion) {
      this.observacionControl.setValue(this.data.observacion);
    }
  }

  onCancelar(): void {
    this.dialogRef.close();
  }

  onGuardar(): void {
    this.dialogRef.close(this.observacionControl.value);
  }
}
