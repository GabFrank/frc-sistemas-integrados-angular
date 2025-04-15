import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfiguracionSistema } from '../../services/configuracion.service';

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
    @Inject(MAT_DIALOG_DATA) public data: ConfiguracionSistema
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
      modo: [this.data.modo]
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
        printers: {
          ticket: formValue.ticketPrinter,
          factura: formValue.facturaPrinter
        }
      };
      
      this.dialogRef.close(config);
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
} 