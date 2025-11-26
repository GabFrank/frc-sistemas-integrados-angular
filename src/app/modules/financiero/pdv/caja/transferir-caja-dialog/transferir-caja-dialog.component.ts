import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CajaService } from '../caja.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { LoginService } from '../../../../login/login.service';
import { TabService } from '../../../../../layouts/tab/tab.service';

export interface TransferirCajaData {
  cajaId: number;
}

@Component({
  selector: 'app-transferir-caja-dialog',
  templateUrl: './transferir-caja-dialog.component.html',
  styleUrls: ['./transferir-caja-dialog.component.scss']
})
export class TransferirCajaDialogComponent implements OnInit {
  
  usuarioControl = new FormControl(null, [Validators.required]);
  passwordControl = new FormControl(null, [Validators.required, Validators.min(2)]);

  hidePassword = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TransferirCajaData,
    private matDialogRef: MatDialogRef<TransferirCajaDialogComponent>,
    private cajaService: CajaService,
    private notificacionService: NotificacionSnackbarService,
    private loginService: LoginService,
    private tabService: TabService
  ) { }

  ngOnInit(): void {
  }

  onCancel() {
    this.matDialogRef.close();
  }

  onConfirm() {
    if (this.usuarioControl.value && this.passwordControl.value) {
      this.loginService.login(this.usuarioControl.value, this.passwordControl.value).subscribe(res => {
        if (res.usuario != null) {
          this.transferir(res.usuario.id);
        } else {
          this.notificacionService.openAlgoSalioMal('Usuario o contraseña incorrectos');
        }
      }, err => {
        this.notificacionService.openAlgoSalioMal('Error al verificar usuario');
      });
    } else {
      this.notificacionService.openWarn('Debe ingresar usuario y contraseña');
    }
  }

  transferir(usuarioId: number) {
    this.cajaService.onTransferirCaja(this.data.cajaId, usuarioId).subscribe(res => {
      if (res) {
        this.notificacionService.openSucess('Caja transferida correctamente');
        this.matDialogRef.close(true);
        setTimeout(() => {
          this.tabService.removeCurrentTab();
        }, 500);
      }
    }, err => {
      this.notificacionService.openWarn(err.message);
    })
  }

}
