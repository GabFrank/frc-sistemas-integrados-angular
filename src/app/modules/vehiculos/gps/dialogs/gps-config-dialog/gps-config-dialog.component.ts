import { ChangeDetectionStrategy, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Gps } from '../../models/gps.model';

@Component({
  selector: 'app-gps-config-dialog',
  templateUrl: './gps-config-dialog.component.html',
  styleUrls: ['./gps-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpsConfigDialogComponent implements OnInit {
  private fb = inject(FormBuilder);

  configForm: FormGroup;
  gps: Gps;

  constructor(
    public dialogRef: MatDialogRef<GpsConfigDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Gps
  ) {
    this.gps = data;
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.configForm = this.fb.group({
      // General/Motor
      motorEstado: [true], // true = enabled, false = cut
      sleepMode: [false],
      reportInterval: [30], // seconds

      // Alertas
      velocidadLimite: [100],
      alertaVelocidad: [false],
      alertaVibracion: [false],
      alertaBateriaBaja: [true],
      alertaACC: [true],

      // Geocerca
      geofenceEnabled: [false],
      geofenceRadio: [1000],

      // APN
      apnName: ['internet.tigo.py'],
      apnUser: [''],
      apnPass: ['']
    });
  }

  onSave(): void {
    // Solo maqueta por ahora
    this.dialogRef.close();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
