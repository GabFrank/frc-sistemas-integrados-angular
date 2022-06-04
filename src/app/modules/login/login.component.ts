import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { Subscription } from "rxjs";
import { connectionStatusSub } from "../../app.module";
import { MainService } from "../../main.service";
import { CargandoDialogService } from "../../shared/components/cargando-dialog/cargando-dialog.service";
import { LoginService } from "./login.service";

import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";

@UntilDestroy()
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  formGroup: FormGroup;
  nicknameControl = new FormControl(null, Validators.required);
  passwordControl = new FormControl(null, [
    Validators.required,
    Validators.min(2),
  ]);
  showBienvenida = false;
  errorMessage: string;

  statusSub: Subscription;

  constructor(
    private loginService: LoginService,
    private dialogRef: MatDialogRef<LoginComponent>,
    public mainService: MainService,
    private cargandoDialogService: CargandoDialogService
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.verficarAuth();

    this.statusSub = connectionStatusSub
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.verficarAuth();
        }
      });
  }

  createForm() {
    this.formGroup = new FormGroup({
      // nickname: new FormControl(null, Validators.required),
      // password: new FormControl(null, Validators.required),
    });
    this.formGroup.addControl("nickname", this.nicknameControl);
    this.formGroup.addControl("password", this.passwordControl);
  }

  onEntrar() {
    if (this.nicknameControl.valid && this.passwordControl.valid) {
      this.cargandoDialogService.openDialog();
      this.loginService
        .login(this.nicknameControl.value, this.passwordControl.value)
        .subscribe((res) => {
          this.cargandoDialogService.closeDialog();
          if (res.usuario != null) {
            this.mainService.authenticationSub.next(true);
            this.mainService.load()
            this.showBienvenida = true;
            this.errorMessage = null;
            setTimeout(() => {
              this.dialogRef.close();
            }, 2000);
          } else if (res.error != null) {
            this.mainService.authenticationSub.next(false);
            this.errorMessage = res.error.message;
          }
        });
    }
  }

  onCancelar() { }

  onPassOrNicknameForgot() { }

  onNewUser() { }

  verficarAuth() {
    this.mainService
      .isAuthenticated()
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res) {
          this.showBienvenida = true;
          setTimeout(() => {
            this.dialogRef.close();
          }, 2000);
        }
      });
  }

  onConfigurarServidor() {
    this.dialogRef.close(false)
  }
}
