import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Gps } from '../../models/gps.model';
import { GpsService } from '../../service/gps.service';
import { take, timeout, startWith, map } from 'rxjs/operators';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';

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
  
  // Controles
  motorEstadoControl = new FormControl(!this.data.motorBloqueado);
  sleepModeControl = new FormControl(this.data.modoSueno || false);
  reportIntervalControl = new FormControl(this.data.intervaloReporte || 30);
  velocidadLimiteControl = new FormControl(this.data.velocidadLimite ?? 100);
  alertaVelocidadControl = new FormControl(this.data.alertaVelocidad ?? true);
  alertaVibracionControl = new FormControl(this.data.alertaVibracion ?? false);
  alertaBateriaBajaControl = new FormControl(this.data.alertaBateriaBaja ?? true);
  alertaAccControl = new FormControl(this.data.alertaAcc ?? true);
  apnNameControl = new FormControl('internet');

  // Observables para el template
  motorLabel$: Observable<string>;
  motorStatusDesc$: Observable<string>;
  motorEnabled$: Observable<boolean>;
  sleepModeEnabled$: Observable<boolean>;
  reportInterval$: Observable<number>;
  alertaVelocidadEnabled$: Observable<boolean>;
  velocidadLimite$: Observable<number>;
  alertaVibracionEnabled$: Observable<boolean>;
  alertaBateriaBajaEnabled$: Observable<boolean>;
  alertaAccEnabled$: Observable<boolean>;
  apnName$: Observable<string>;

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
    this.initObservables();
  }

  initForm(): void {
    this.configForm = this.fb.group({
      motorEstado: this.motorEstadoControl,
      sleepMode: this.sleepModeControl,
      reportInterval: this.reportIntervalControl,
      velocidadLimite: this.velocidadLimiteControl,
      alertaVelocidad: this.alertaVelocidadControl,
      alertaVibracion: this.alertaVibracionControl,
      alertaBateriaBaja: this.alertaBateriaBajaControl,
      alertaAcc: this.alertaAccControl,
      apnName: this.apnNameControl
    });
  }

  initObservables(): void {
    this.motorEnabled$ = this.motorEstadoControl.valueChanges.pipe(startWith(this.motorEstadoControl.value));
    this.sleepModeEnabled$ = this.sleepModeControl.valueChanges.pipe(startWith(this.sleepModeControl.value));
    this.reportInterval$ = this.reportIntervalControl.valueChanges.pipe(startWith(this.reportIntervalControl.value));
    this.alertaVelocidadEnabled$ = this.alertaVelocidadControl.valueChanges.pipe(startWith(this.alertaVelocidadControl.value));
    this.velocidadLimite$ = this.velocidadLimiteControl.valueChanges.pipe(startWith(this.velocidadLimiteControl.value));
    this.alertaVibracionEnabled$ = this.alertaVibracionControl.valueChanges.pipe(startWith(this.alertaVibracionControl.value));
    this.alertaBateriaBajaEnabled$ = this.alertaBateriaBajaControl.valueChanges.pipe(startWith(this.alertaBateriaBajaControl.value));
    this.alertaAccEnabled$ = this.alertaAccControl.valueChanges.pipe(startWith(this.alertaAccControl.value));
    this.apnName$ = this.apnNameControl.valueChanges.pipe(startWith(this.apnNameControl.value));

    this.motorLabel$ = this.motorEnabled$.pipe(
      map(enabled => enabled ? 'MOTOR ENCENDIDO' : 'MOTOR BLOQUEADO')
    );

    this.motorStatusDesc$ = this.motorEnabled$.pipe(
      map(enabled => enabled ? 'El motor está habilitado' : 'El motor se encuentra bloqueado')
    );
  }

  onUpdateMotor(): void {
    this.loading.motor = true;
    this.cdr.markForCheck();
    const motorTipo = this.motorEstadoControl.value ? 'MOTOR_ON' : 'MOTOR_OFF';
    
    this.gpsService.onEnviarComando(this.gps.id, motorTipo)
      .pipe(
        take(1),
        timeout(10000),
        untilDestroyed(this)
      )
      .subscribe({
        next: () => { 
          this.loading.motor = false; 
          this.gps.motorBloqueado = !this.motorEstadoControl.value;
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
    const sleepTipo = this.sleepModeControl.value ? 'SLEEP_ON' : 'SLEEP_OFF';
    
    this.gpsService.onEnviarComando(this.gps.id, sleepTipo)
      .pipe(
        take(1),
        timeout(10000),
        untilDestroyed(this)
      )
      .subscribe({
        next: () => { 
          this.loading.sleep = false; 
          this.gps.modoSueno = !!this.sleepModeControl.value;
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
    const intervalValue = this.reportIntervalControl.value || 30;
    
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
    const apn = this.apnNameControl.value;
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
      !!this.alertaVelocidadControl.value,
      this.velocidadLimiteControl.value || 100,
      !!this.alertaVibracionControl.value,
      !!this.alertaBateriaBajaControl.value,
      !!this.alertaAccControl.value
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
