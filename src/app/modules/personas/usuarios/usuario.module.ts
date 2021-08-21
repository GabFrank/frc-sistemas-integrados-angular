import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioComponent } from './usuario.component';
import { ListUsuarioComponent } from './list-usuario/list-usuario.component';
import { SharedModule } from '../../../shared/shared.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../commons/core/material.module';



@NgModule({
  declarations: [UsuarioComponent, ListUsuarioComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule
  ]
})
export class UsuarioModule { }
