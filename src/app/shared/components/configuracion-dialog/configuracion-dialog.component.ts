import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfiguracionSistema, ConfiguracionService, UpdateChannel } from '../../services/configuracion.service';

@Component({
  selector: 'app-configuracion-dialog',
  templateUrl: './configuracion-dialog.component.html',
  styleUrls: ['./configuracion-dialog.component.scss']
})
export class ConfiguracionDialogComponent implements OnInit {
  configForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ConfiguracionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfiguracionSistema,
    private configService: ConfiguracionService
  ) { }

  ngOnInit(): void {
    this.configForm = this.fb.group({
      serverIp: [this.data.serverIp, Validators.required],
      serverPort: [this.data.serverPort, Validators.required],
      serverCentralIp: [this.data.serverCentralIp, Validators.required],
      serverCentralPort: [this.data.serverCentralPort, Validators.required],
      local: [this.data.local],
      pdvId: [this.data.pdvId],
      precios: [this.data.precios],
      ticketPrinter: [this.data.printers?.ticket || ''],
      facturaPrinter: [this.data.printers?.factura || ''],
      modo: [this.data.modo],
      isLocal: [this.data.isLocal !== undefined ? this.data.isLocal : true],
      updateChannel: [this.data.updateChannel || null, Validators.required]
    });
  }

  onSave(): void {
    // El recorte va ANTES de mirar `valid`: `Validators.required` da por bueno un campo con un
    // solo espacio, asi que validar sobre el valor crudo dejaba pasar una IP en blanco, que
    // termina en el mismo DOMException que este fix vino a matar.
    this.normalizarEspacios();
    if (this.configForm.valid) {
      // Se recorta TODO antes de armar la config, no campo por campo. Un espacio pegado sin
      // querer en la IP --`' 100.64.0.2'`-- produce `ws:// 100.64.0.2:8080/...` y sale un
      // `DOMException: Failed to construct 'WebSocket': The URL is invalid` que no menciona la
      // configuracion por ningun lado. Costo un rato de diagnostico en el testeo del 2026-09-08.
      const formValue = this.configForm.value;
      
      // Convert form values to ConfiguracionSistema
      const config: ConfiguracionSistema = {
        serverIp: formValue.serverIp,
        serverPort: formValue.serverPort,
        serverCentralIp: formValue.serverCentralIp,
        serverCentralPort: formValue.serverCentralPort,
        local: formValue.local,
        pdvId: formValue.pdvId,
        precios: formValue.precios,
        modo: formValue.modo,
        isLocal: formValue.isLocal,
        updateChannel: formValue.updateChannel,
        printers: {
          ticket: formValue.ticketPrinter,
          factura: formValue.facturaPrinter
        },
        isConfigured: true
      };
      
      this.dialogRef.close(config);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
  
  /**
   * Create a backup of the current configuration
   * This uses the current values in the form (even if not saved)
   */
  onBackup(): void {
    // Create a temporary configuration object from the current form values
    const formValue = this.configForm.value;
    const tempConfig: ConfiguracionSistema = {
      serverIp: formValue.serverIp || this.data.serverIp,
      serverPort: formValue.serverPort || this.data.serverPort,
      serverCentralIp: formValue.serverCentralIp || this.data.serverCentralIp,
      serverCentralPort: formValue.serverCentralPort || this.data.serverCentralPort,
      local: formValue.local || this.data.local,
      pdvId: formValue.pdvId || this.data.pdvId,
      precios: formValue.precios || this.data.precios,
      modo: formValue.modo || this.data.modo,
      isLocal: formValue.isLocal !== undefined ? formValue.isLocal : this.data.isLocal,
      updateChannel: formValue.updateChannel || this.data.updateChannel || 'stable',
      printers: {
        ticket: formValue.ticketPrinter || this.data.printers?.ticket || '',
        factura: formValue.facturaPrinter || this.data.printers?.factura || ''
      },
      isConfigured: true
    };
    
    // Use the configuration service to create a backup
    this.configService.createConfigBackup();
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

