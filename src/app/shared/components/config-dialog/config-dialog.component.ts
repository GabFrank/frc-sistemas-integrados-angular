import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppConfig } from '../../services/config.service';
import { NotificacionSnackbarService } from '../../../notificacion-snackbar.service';

@Component({
  selector: 'app-config-dialog',
  templateUrl: './config-dialog.component.html',
  styleUrls: ['./config-dialog.component.scss']
})
export class ConfigDialogComponent implements OnInit {
  configForm: FormGroup;
  isNewConfig: boolean;
  displayedColumns: string[] = ['id', 'nombre', 'ip', 'port', 'actions'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ConfigDialogComponent>,
    private notificationService: NotificacionSnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: { config: AppConfig }
  ) {
    this.isNewConfig = !data.config.initialized;
    console.log('Dialog opened with config:', data.config);
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const config = this.data.config;
    
    this.configForm = this.fb.group({
      server: this.fb.group({
        ip: [config.server?.ip || 'localhost', [Validators.required]],
        port: [config.server?.port || '8082', [Validators.required]]
      }),
      central: this.fb.group({
        ip: [config.central?.ip || 'localhost', [Validators.required]],
        port: [config.central?.port || '8081', [Validators.required]]
      }),
      features: this.fb.group({
        useFinancieroDashBoard: [config.features?.useFinancieroDashBoard || false]
      }),
      branding: this.fb.group({
        local: [config.branding?.local || 'CAJA 1'],
        precios: [config.branding?.precios || 'EXPO, EXPO-DEPOSITO'],
        modo: [config.branding?.modo || 'NOT']
      }),
      printers: this.fb.group({
        ticket: [config.printers?.ticket || 'ticket'],
        factura: [config.printers?.factura || '']
      }),
      pdvId: [config.pdvId || 1, [Validators.min(0)]],
      sucursales: this.fb.array([])
    });

    // Add sucursales to form array
    if (config.sucursales && config.sucursales.length > 0) {
      config.sucursales.forEach(sucursal => this.addSucursal(sucursal));
    } else {
      this.addSucursal();
    }

    // Monitor ip and port fields to trim whitespace
    this.configForm.get('server.ip').valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== value) {
          this.configForm.get('server.ip').setValue(trimmed, { emitEvent: false });
        }
      }
    });

    this.configForm.get('server.port').valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== value) {
          this.configForm.get('server.port').setValue(trimmed, { emitEvent: false });
        }
      }
    });

    console.log('Form initialized:', this.configForm.value);
  }

  get sucursalesArray(): FormArray {
    return this.configForm.get('sucursales') as FormArray;
  }

  addSucursal(sucursal?: any): void {
    this.sucursalesArray.push(
      this.fb.group({
        id: [sucursal?.id ?? 0, [Validators.required, Validators.min(0)]],
        nombre: [sucursal?.nombre || 'NUEVA SUCURSAL', [Validators.required]],
        ip: [sucursal?.ip || 'localhost', [Validators.required]],
        port: [sucursal?.port || '8082', [Validators.required]]
      })
    );
  }

  removeSucursal(index: number): void {
    this.sucursalesArray.removeAt(index);
  }

  saveConfig(): void {
    // El recorte va ANTES de mirar `valid`: `Validators.required` da por bueno un campo con un
    // solo espacio, asi que validar sobre el valor crudo dejaba pasar una IP en blanco.
    this.normalizarEspacios();
    if (this.configForm.valid) {
      // Se recorta TODO, no solo `server.ip` y `server.port` como hacian las dos suscripciones de
      // arriba: la IP y el puerto de CADA sucursal salen del mismo formulario y tienen el mismo
      // problema. Un espacio pegado sin querer arma `ws:// 100.64.0.2:8080/...` y falla con un
      // `DOMException: The URL is invalid` que no menciona la configuracion por ningun lado.
      this.dialogRef.close(this.configForm.value);
    } else {
      this.notificationService.openWarn('Por favor corrija los errores en el formulario');
      this.markFormGroupTouched(this.configForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }

  cancel(): void {
    if (this.isNewConfig) {
      this.notificationService.openWarn('La configuración inicial es necesaria para el funcionamiento de la aplicación');
      return;
    }
    this.dialogRef.close();
  }

  /**
   * Deja el formulario sin espacios de sobra, control por control, ANTES de validar.
   *
   * Recortar el VALOR al guardar no alcanzaba: `Validators.required` sólo rechaza null/''/false,
   * así que un campo con un espacio pasaba la validación y recién después quedaba vacío. Tocando
   * los controles, lo que se valida es lo que se va a guardar.
   */
  private normalizarEspacios(control: AbstractControl = this.configForm): void {
    if (control instanceof FormGroup || control instanceof FormArray) {
      Object.values(control.controls).forEach((c) => this.normalizarEspacios(c as AbstractControl));
      return;
    }
    const v = control.value;
    if (typeof v === 'string' && v !== v.trim()) {
      control.setValue(v.trim(), { emitEvent: false });
    }
  }
}

