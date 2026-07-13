import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export type CredencialesCupsModo = 'compartir' | 'instalar-local';

export interface CredencialesCupsData {
  /** 'compartir' (a un servidor por IP) o 'instalar-local' (solo pide la contraseña de sudo). */
  modo?: CredencialesCupsModo;
  usuario?: string;
  ip?: string; // IP de esta PC
  cola?: string;
  centralIp?: string;
  centralPort?: string;
  filialIp?: string;
  filialPort?: string;
  destino?: 'CENTRAL' | 'FILIAL';
}

export interface CredencialesCupsResult {
  usuario: string;
  password: string;
  pcIp: string;
  /** true = se comparte al servidor central; false = a la filial/servidor local. Decide el token. */
  esCentral: boolean;
  servidorIp: string;
  servidorPort: string;
}

/**
 * Pide la contraseña de administrador de esta PC para compartir/instalar la impresora local.
 * La contraseña se usa una sola vez (sudo -S en el proceso main de Electron) y no se persiste.
 *  - modo 'compartir': además elige el servidor destino (central o filial) y su IP/puerto → el
 *    servidor instala una cola que apunta a esta PC. El destino decide qué token se manda.
 *  - modo 'instalar-local': solo la contraseña de sudo (la impresora se instala en esta PC).
 */
@Component({
  selector: 'app-credenciales-cups-dialog',
  templateUrl: './credenciales-cups-dialog.component.html',
  styleUrls: ['./credenciales-cups-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CredencialesCupsDialogComponent {

  modo: CredencialesCupsModo = 'compartir';
  esLocal = false;

  usuarioControl = new FormControl('');
  passwordControl = new FormControl('');
  pcIpControl = new FormControl('');
  destinoControl = new FormControl<'CENTRAL' | 'FILIAL'>('CENTRAL');
  servidorIpControl = new FormControl('');
  servidorPortControl = new FormControl('');
  ocultar = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CredencialesCupsData,
    private dialogRef: MatDialogRef<CredencialesCupsDialogComponent>,
  ) {
    this.modo = data?.modo ?? 'compartir';
    this.esLocal = this.modo === 'instalar-local';
    this.usuarioControl.setValue(data?.usuario ?? '');
    this.pcIpControl.setValue(data?.ip ?? '');
    this.destinoControl.setValue(data?.destino ?? 'CENTRAL');
    this.aplicarDestino(this.destinoControl.value);
  }

  /** Al cambiar el servidor destino, autocompleta su IP/puerto desde la config recibida. */
  aplicarDestino(destino: 'CENTRAL' | 'FILIAL' | null): void {
    if (destino === 'FILIAL') {
      this.servidorIpControl.setValue(this.data?.filialIp ?? '');
      this.servidorPortControl.setValue(this.data?.filialPort ?? '8082');
    } else {
      this.servidorIpControl.setValue(this.data?.centralIp ?? '');
      this.servidorPortControl.setValue(this.data?.centralPort ?? '8081');
    }
  }

  aceptar(): void {
    const resultado: CredencialesCupsResult = {
      usuario: (this.usuarioControl.value ?? '').trim(),
      password: this.passwordControl.value ?? '',
      pcIp: (this.pcIpControl.value ?? '').trim(),
      esCentral: this.destinoControl.value !== 'FILIAL',
      servidorIp: (this.servidorIpControl.value ?? '').trim(),
      servidorPort: (this.servidorPortControl.value ?? '').trim(),
    };
    this.dialogRef.close(resultado);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
