import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';
import { catchError, take, timeout } from 'rxjs/operators';
import { CajaService } from '../caja.service';
import { NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { LoginService } from '../../../../login/login.service';
import { TabService } from '../../../../../layouts/tab/tab.service';
import { MainService } from '../../../../../main.service';
import { LoginDialogService } from '../../../../../shared/services/login-dialog.service';
import { erroresDeRechazo } from '../../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../../shared/services/timeout-link';

export interface TransferirCajaData {
  cajaId: number;
}

/** El login final ya no tiene vuelta atrás (la caja es del destino): no puede quedar esperando. */
const TIMEOUT_LOGIN_DESTINO_MS = 20000;

@Component({
  selector: 'app-transferir-caja-dialog',
  templateUrl: './transferir-caja-dialog.component.html',
  styleUrls: ['./transferir-caja-dialog.component.scss']
})
export class TransferirCajaDialogComponent implements OnInit {

  usuarioControl = new FormControl(null, [Validators.required]);
  passwordControl = new FormControl(null, [Validators.required, Validators.min(2)]);

  hidePassword = true;
  /** Validar, transferir y pasar la sesión: mientras corre no se acepta otro Enter ni clic. */
  enCurso = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: TransferirCajaData,
    private matDialogRef: MatDialogRef<TransferirCajaDialogComponent>,
    private cajaService: CajaService,
    private notificacionService: NotificacionSnackbarService,
    private loginService: LoginService,
    private tabService: TabService,
    private mainService: MainService,
    private loginDialogService: LoginDialogService
  ) { }

  ngOnInit(): void {
  }

  onCancel() {
    this.matDialogRef.close();
  }

  /**
   * Valida al destino sin tocar la sesión, transfiere con la sesión del dueño y recién entonces pasa la
   * sesión al destino. Si algo falla antes de transferir, la sesión sigue siendo la del dueño.
   */
  onConfirm() {
    if (this.enCurso) return;
    const nickname = this.usuarioControl.value;
    const password = this.passwordControl.value;
    if (!nickname || !password) {
      this.notificacionService.openWarn('Debe ingresar usuario y contraseña');
      return;
    }
    this.enCurso = true;
    this.loginService.verificarCredenciales(nickname, password).subscribe({
      next: (usuarioId) => this.transferir(usuarioId, nickname, password),
      error: (err) => {
        this.enCurso = false;
        this.notificacionService.openAlgoSalioMal(err?.error?.message || 'No se pudo verificar el usuario');
      }
    });
  }

  transferir(usuarioId: number, nickname: string, password: string) {
    this.cajaService.onTransferirCaja(this.data.cajaId, usuarioId).subscribe(res => {
      if (res) {
        this.pasarSesionAlDestino(nickname, password);
      } else {
        this.enCurso = false;
        this.notificacionService.openWarn('No se pudo transferir la caja.');
      }
    }, err => {
      this.enCurso = false;
      // En un rechazo el genérico ya mostró el motivo; si se transfirió, repetir lo rechaza el servidor (#488)
      if (erroresDeRechazo(err) == null && !esTimeoutDeLink(err)) {
        this.notificacionService.openWarn(
          'No se pudo confirmar si se transfirió la caja: si se transfirió, esta pestaña ya no corresponde. Revisá antes de repetir.', 8);
      }
    })
  }

  /** La caja ya es del destino: la PC queda con su sesión, o sin sesión si no se puede iniciar. */
  private pasarSesionAlDestino(nickname: string, password: string) {
    this.loginService.login(nickname, password).pipe(
      take(1),
      timeout(TIMEOUT_LOGIN_DESTINO_MS),
      catchError(() => of(null))
    ).subscribe(res => {
      this.matDialogRef.close(true);
      if (res?.usuario != null) {
        this.notificacionService.openSucess('Caja transferida correctamente');
        setTimeout(() => {
          this.tabService.removeCurrentTab();
        }, 500);
        return;
      }
      // Sin esto quedaba el dueño en memoria, sin token y con una caja que ya no es suya.
      this.notificacionService.openWarn(`La caja se transfirió a ${nickname}: iniciá sesión con ese usuario.`, 8);
      this.mainService.logout();
      this.tabService.removeAllTabs();
      this.loginDialogService.openLoginDialog();
    });
  }

}
