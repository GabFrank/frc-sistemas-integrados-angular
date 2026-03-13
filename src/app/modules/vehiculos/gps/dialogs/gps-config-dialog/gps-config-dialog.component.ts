import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Gps } from '../../models/gps.model';
import { GpsService } from '../../service/gps.service';
import { take, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-gps-config-dialog',
  templateUrl: './gps-config-dialog.component.html',
  styleUrls: ['./gps-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpsConfigDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gpsService = inject(GpsService);
  private cdr = inject(ChangeDetectorRef);

  configForm: FormGroup;
  gps: Gps;
  loading: { [key: string]: boolean } = {
    motor: false,
    sleep: false,
    interval: false,
    apn: false,
    alertaVelocidad: false,
    alertaVibracion: false,
    alertaBateriaBaja: false,
    alertaAcc: false
  };

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
      motorEstado: [!this.gps.motorBloqueado],
      sleepMode: [this.gps.modoSueno || false],
      reportInterval: [this.gps.intervaloReporte || 30],

      velocidadLimite: [this.gps.velocidadLimite ?? 100],
      alertaVelocidad: [this.gps.alertaVelocidad ?? true],
      alertaVibracion: [this.gps.alertaVibracion ?? false],
      alertaBateriaBaja: [this.gps.alertaBateriaBaja ?? true],
      alertaAcc: [this.gps.alertaAcc ?? true],

      // APN
      apnName: ['internet'],
      apnUser: [''],
      apnPass: ['']
    });
  }

  async onUpdateMotor(): Promise<void> {
    this.loading.motor = true;
    this.cdr.markForCheck();
    const motorTipo = this.configForm.get('motorEstado')?.value ? 'MOTOR_ON' : 'MOTOR_OFF';
    return new Promise((resolve) => {
      this.gpsService.onEnviarComando(this.gps.id, motorTipo)
        .pipe(
          take(1),
          timeout(10000)
        )
        .subscribe({
          next: () => { 
            this.loading.motor = false; 
            this.gps.motorBloqueado = !this.configForm.get('motorEstado')?.value;
            this.cdr.markForCheck(); 
            resolve(); 
          },
          error: () => { 
            this.loading.motor = false; 
            this.cdr.markForCheck(); 
            resolve(); 
          }
        });
    });
  }

  async onUpdateSleep(): Promise<void> {
    this.loading.sleep = true;
    this.cdr.markForCheck();
    const sleepTipo = this.configForm.get('sleepMode')?.value ? 'SLEEP_ON' : 'SLEEP_OFF';
    return new Promise((resolve) => {
      this.gpsService.onEnviarComando(this.gps.id, sleepTipo)
        .pipe(
          take(1),
          timeout(10000)
        )
        .subscribe({
          next: () => { 
            this.loading.sleep = false; 
            this.gps.modoSueno = this.configForm.get('sleepMode')?.value;
            this.cdr.markForCheck(); 
            resolve(); 
          },
          error: () => { 
            this.loading.sleep = false; 
            this.cdr.markForCheck(); 
            resolve(); 
          }
        });
    });
  }

  async onUpdateInterval(): Promise<void> {
    this.loading.interval = true;
    this.cdr.markForCheck();
    const interval = this.configForm.get('reportInterval')?.value;
    return new Promise((resolve) => {
      this.gpsService.onEnviarComando(this.gps.id, 'INTERVALO', interval.toString())
        .pipe(
          take(1),
          timeout(10000)
        )
        .subscribe({
          next: () => { 
            this.loading.interval = false; 
            this.gps.intervaloReporte = this.configForm.get('reportInterval')?.value;
            this.cdr.markForCheck(); 
            resolve(); 
          },
          error: () => { 
            this.loading.interval = false; 
            this.cdr.markForCheck(); 
            resolve(); 
          }
        });
    });
  }

  async onUpdateApn(): Promise<void> {
    this.loading.apn = true;
    this.cdr.markForCheck();
    const apn = this.configForm.get('apnName')?.value;
    const user = this.configForm.get('apnUser')?.value || '';
    const pass = this.configForm.get('apnPass')?.value || '';
    const valor = [apn, user, pass].join(',');
    return new Promise((resolve) => {
      this.gpsService.onEnviarComando(this.gps.id, 'APN', valor)
        .pipe(
          take(1),
          timeout(10000)
        )
        .subscribe({
          next: () => { this.loading.apn = false; this.cdr.markForCheck(); resolve(); },
          error: () => { this.loading.apn = false; this.cdr.markForCheck(); resolve(); }
        });
    });
  }

  /**
   * Guarda la configuración de una alerta push en la BD.
   */
  async onGuardarAlerta(tipo: string): Promise<void> {
    this.loading[tipo] = true;
    this.cdr.markForCheck();
    const form = this.configForm;
    return new Promise((resolve) => {
      this.gpsService.onGuardarConfigAlertas(
        this.gps.id,
        form.get('alertaVelocidad')?.value,
        form.get('velocidadLimite')?.value,
        form.get('alertaVibracion')?.value,
        form.get('alertaBateriaBaja')?.value,
        form.get('alertaAcc')?.value
      )
        .pipe(
          take(1),
          timeout(10000)
        )
        .subscribe({
          next: (gpsActualizado) => {
            this.loading[tipo] = false;
            if (gpsActualizado) {
              // Actualizar el GPS local con los datos persistidos
              this.gps = { ...this.gps, ...gpsActualizado };
            }
            this.cdr.markForCheck();
            resolve();
          },
          error: () => {
            this.loading[tipo] = false;
            this.cdr.markForCheck();
            resolve();
          }
        });
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
