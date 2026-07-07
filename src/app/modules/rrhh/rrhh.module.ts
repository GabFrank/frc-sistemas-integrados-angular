import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { ListConfiguracionRrhhComponent } from './configuracion-rrhh/list-configuracion-rrhh/list-configuracion-rrhh.component';
import { EditConfiguracionRrhhDialogComponent } from './configuracion-rrhh/edit-configuracion-rrhh-dialog/edit-configuracion-rrhh-dialog.component';

@NgModule({
  declarations: [
    ListConfiguracionRrhhComponent,
    EditConfiguracionRrhhDialogComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule
  ]
})
export class RrhhModule { }
