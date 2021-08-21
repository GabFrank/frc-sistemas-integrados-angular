import { Component, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { MainService } from "../../main.service";
import { CargandoDialogService } from "../../shared/components/cargando-dialog/cargando-dialog.service";
import { LoginResponse, LoginService } from "./login.service";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  formGroup: FormGroup;
  nicknameControl = new FormControl(null, Validators.required);
  passwordControl = new FormControl(null, [Validators.required, Validators.min(2)]);
  showBienvenida = false;
  errorMessage : string;

  constructor(
    private loginService: LoginService,
    private dialogRef: MatDialogRef<LoginComponent>,
    private mainService: MainService,
    private cargandoDialogService: CargandoDialogService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.verficarAuth();
  }

  createForm() {
    this.formGroup = new FormGroup(
      {
      // nickname: new FormControl(null, Validators.required),
      // password: new FormControl(null, Validators.required),
    }
    );
    this.formGroup.addControl('nickname', this.nicknameControl);
    this.formGroup.addControl('password', this.passwordControl)

  }

  onEntrar() {
    if (this.nicknameControl.valid && this.passwordControl.valid) {
      this.cargandoDialogService.openDialog();
      this.loginService
        .login(this.nicknameControl.value, this.passwordControl.value)
        .subscribe((res) => {
          this.cargandoDialogService.closeDialog();
          if (res.usuario != null) {
            this.showBienvenida = true;
            this.errorMessage = null;
            setTimeout(() => {
              this.dialogRef.close();
            }, 2000);
          } else if(res.error != null) {
            this.errorMessage = res.error.message;
          }
        });
    }
  }

  onCancelar() {}

  onPassOrNicknameForgot() {}

  onNewUser() {}

  verficarAuth() {
    this.mainService.isAuthenticated().subscribe((res) => {
      if (res) {
        console.log("Autenticado");
        this.showBienvenida = true;
        setTimeout(() => {
          this.dialogRef.close();
        }, 2000);
      }
    });
  }
}
