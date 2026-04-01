import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
      updateChannel: [this.data.updateChannel || 'stable']
    });
  }

  onSave(): void {
    if (this.configForm.valid) {
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
} 