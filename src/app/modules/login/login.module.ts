import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { LoginComponent } from './login.component';
import {MatButtonModule} from '@angular/material/button';
import { FlexLayoutModule } from 'ngx-flexible-layout';



@NgModule({
  declarations: [LoginComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    MatButtonModule
  ]
})
export class LoginModule { }
