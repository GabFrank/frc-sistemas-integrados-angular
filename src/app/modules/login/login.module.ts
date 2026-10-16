import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './login.component';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { RecuperarContrasenaDialogComponent } from './recuperar-contrasena-dialog/recuperar-contrasena-dialog.component';



@NgModule({
  declarations: [LoginComponent, RecuperarContrasenaDialogComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatIconModule,
    NgxQRCodeModule
  ]
})
export class LoginModule { }
