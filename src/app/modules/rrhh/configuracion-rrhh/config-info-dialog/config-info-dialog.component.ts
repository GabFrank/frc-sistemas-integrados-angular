import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CONFIGURACION_RRHH_HELP, ConfigHelp } from '../configuracion-rrhh-help';

export interface ConfigInfoDialogData {
  clave: string;
  valor: string;
  descripcion: string;
}

@Component({
  selector: 'app-config-info-dialog',
  templateUrl: './config-info-dialog.component.html',
  styleUrls: ['./config-info-dialog.component.scss']
})
export class ConfigInfoDialogComponent {

  help: ConfigHelp;
  clave: string;
  valor: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfigInfoDialogData,
    private dialogRef: MatDialogRef<ConfigInfoDialogComponent>
  ) {
    this.clave = data.clave;
    this.valor = data.valor;
    this.help = CONFIGURACION_RRHH_HELP[data.clave] || {
      titulo: data.clave,
      descripcion: data.descripcion || 'Sin descripción disponible para esta configuración.'
    };
  }

  onCerrar() { this.dialogRef.close(); }
}
