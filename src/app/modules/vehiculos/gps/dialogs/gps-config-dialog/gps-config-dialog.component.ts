import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Gps } from '../../models/gps.model';
import { GpsService } from '../../service/gps.service';
import { take, timeout } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

interface LoadingState {
  motor: boolean;
  sleep: boolean;
  interval: boolean;
  apn: boolean;
  alertaVelocidad: boolean;
  alertaVibracion: boolean;
  alertaBateriaBaja: boolean;
  alertaAcc: boolean;
}

@UntilDestroy()
@Component({
  selector: 'app-gps-config-dialog',
  templateUrl: './gps-config-dialog.component.html',
  styleUrls: ['./gps-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GpsConfigDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly gpsService = inject(GpsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(MatDialogRef<GpsConfigDialogComponent>);
  private readonly data = inject<Gps>(MAT_DIALOG_DATA);

  configForm: FormGroup;
  gps: Gps = this.data;
  
  loading: LoadingState = {
    motor: false,
    sleep: false,
    interval: false,
    apn: false,
    alertaVelocidad: false,
    alertaVibracion: false,
    alertaBateriaBaja: false,
    alertaAcc: false
  };

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
      apnName: ['internet']
    });
  }

  getControlValue(controlName: string): any {
    return this.configForm.get(controlName)?.value;
  }

  getMotorLabel(): string {
    return this.getControlValue('motorEstado') ? 'MOTOR ENCENDIDO' : 'MOTOR BLOQUEADO';
  }

  onUpdateMotor(): void {
    this.loading.motor = true;
    this.cdr.markForCheck();
    const motorTipo = this.getControlValue('motorEstado') ? 'MOTOR_ON' : 'MOTOR_OFF';
    
    this.gpsService.onEnviarComando(this.gps.id, motorTipo)
      .pipe(
        take(1),
        timeout(10000),
        untilDestroyed(this)
      )
      .subscribe({
        next: () => { 
          this.loading.motor = false; 
          this.gps.motorBloqueado = !this.getControlValue('motorEstado');
          this.cdr.markForCheck(); 
        },
        error: () => { 
          this.loading.motor = false; 
          this.cdr.markForCheck(); 
        }
      });
  }

  onUpdateSleep(): void {
    this.loading.sleep = true;
    this.cdr.markForCheck();
    const sleepTipo = this.getControlValue('sleepMode') ? 'SLEEP_ON' : 'SLEEP_OFF';
    
    this.gpsService.onEnviarComando(this.gps.id, sleepTipo)
      .pipe(
        take(1),
        timeout(10000),
        untilDestroyed(this)
      )
      .subscribe({
        next: () => { 
          this.loading.sleep = false; 
          this.gps.modoSueno = this.getControlValue('sleepMode');
          this.cdr.markForCheck(); 
        },
        error: () => { 
          this.loading.sleep = false; 
          this.cdr.markForCheck(); 
        }
      });
  }

  onUpdateInterval(): void {
    this.loading.interval = true;
    this.cdr.markForCheck();
    const intervalValue = this.getControlValue('reportInterval');
    
    this.gpsService.onEnviarComando(this.gps.id, 'INTERVALO', intervalValue.toString())
      .pipe(
        take(1),
        timeout(10000),
        untilDestroyed(this)
      )
      .subscribe({
        next: () => { 
          this.loading.interval = false; 
          this.gps.intervaloReporte = intervalValue;
          this.cdr.markForCheck(); 
        },
        error: () => { 
          this.loading.interval = false; 
          this.cdr.markForCheck(); 
        }
      });
  }

  onUpdateApn(): void {
    this.loading.apn = true;
    this.cdr.markForCheck();
    const apn = this.getControlValue('apnName');
    const valor = [apn, '', ''].join(',');
    
    this.gpsService.onEnviarComando(this.gps.id, 'APN', valor)
      .pipe(
        take(1),
        timeout(10000),
        untilDestroyed(this)
      )
      .subscribe({
        next: () => { 
          this.loading.apn = false; 
          this.cdr.markForCheck(); 
        },
        error: () => { 
          this.loading.apn = false; 
          this.cdr.markForCheck(); 
        }
      });
  }

  onGuardarAlerta(tipo: keyof LoadingState): void {
    this.loading[tipo] = true;
    this.cdr.markForCheck();
    
    this.gpsService.onGuardarConfigAlertas(
      this.gps.id,
      this.getControlValue('alertaVelocidad'),
      this.getControlValue('velocidadLimite'),
      this.getControlValue('alertaVibracion'),
      this.getControlValue('alertaBateriaBaja'),
      this.getControlValue('alertaAcc')
    )
      .pipe(
        take(1),
        timeout(10000),
        untilDestroyed(this)
      )
      .subscribe({
        next: (gpsActualizado) => {
          this.loading[tipo] = false;
          if (gpsActualizado) {
            this.gps = { ...this.gps, ...gpsActualizado };
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading[tipo] = false;
          this.cdr.markForCheck();
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

