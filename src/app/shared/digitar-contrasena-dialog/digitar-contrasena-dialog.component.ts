import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NotificacionSnackbarService } from '../../notificacion-snackbar.service';

export class DigitarContrasenaData {
  password?: string;
}

@Component({
  selector: 'app-digitar-contrasena-dialog',
  templateUrl: './digitar-contrasena-dialog.component.html',
  styleUrls: ['./digitar-contrasena-dialog.component.scss']
})
export class DigitarContrasenaDialogComponent implements OnInit {

  passwordControl = new FormControl(null, [Validators.required, Validators.minLength(3)])

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: DigitarContrasenaData,
    private dialogRef: MatDialogRef<DigitarContrasenaDialogComponent>,
    private notificacionService: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {

  }

  onAceptar() {
    if (this.data.password != null) {
      let pass: string = this.passwordControl.value;
      let match = this.data.password?.toUpperCase() == pass?.toUpperCase();
      if (match == true) {
        this.dialogRef.close({match: true})
      } else {
        this.notificacionService.openWarn("Contraseña inválida")
        this.passwordControl.setValue(null)
      }
    } else {
      this.dialogRef.close({ pass: this.passwordControl.value })
    }
  }

  onCancelar() {
    this.dialogRef.close(null)
  }

}
