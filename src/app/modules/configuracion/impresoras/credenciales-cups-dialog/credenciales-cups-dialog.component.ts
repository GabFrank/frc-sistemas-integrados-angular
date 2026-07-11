import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface CredencialesCupsData {
  usuario?: string;
  ip?: string;
  cola?: string;
  centralIp?: string;
  centralPort?: string;
}

export interface CredencialesCupsResult {
  usuario: string;
  password: string;
  pcIp: string;
  centralIp: string;
  centralPort: string;
}

/**
 * Pide la contraseña de administrador de esta PC para compartir la impresora local al servidor
 * central. La contraseña se usa una sola vez (sudo -S en el proceso main de Electron) y no se
 * persiste. El usuario es informativo (usuario del SO con el que corre la app).
 */
@Component({
  selector: 'app-credenciales-cups-dialog',
  templateUrl: './credenciales-cups-dialog.component.html',
  styleUrls: ['./credenciales-cups-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CredencialesCupsDialogComponent {

  usuarioControl = new FormControl('');
  passwordControl = new FormControl('');
  pcIpControl = new FormControl('');
  centralIpControl = new FormControl('');
  centralPortControl = new FormControl('');
  ocultar = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CredencialesCupsData,
    private dialogRef: MatDialogRef<CredencialesCupsDialogComponent>,
  ) {
    this.usuarioControl.setValue(data?.usuario ?? '');
    this.pcIpControl.setValue(data?.ip ?? '');
    this.centralIpControl.setValue(data?.centralIp ?? '');
    this.centralPortControl.setValue(data?.centralPort ?? '8081');
  }

  aceptar(): void {
    const resultado: CredencialesCupsResult = {
      usuario: (this.usuarioControl.value ?? '').trim(),
      password: this.passwordControl.value ?? '',
      pcIp: (this.pcIpControl.value ?? '').trim(),
      centralIp: (this.centralIpControl.value ?? '').trim(),
      centralPort: (this.centralPortControl.value ?? '8081').trim(),
    };
    this.dialogRef.close(resultado);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
