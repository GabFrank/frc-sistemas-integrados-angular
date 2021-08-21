import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FuncionarioComponent } from './funcionario/funcionario.component';
import { ListFuncioarioComponent } from './list-funcioario/list-funcioario.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { FuncionarioDetalleDialogoComponent } from './funcionario-detalle-dialogo/funcionario-detalle-dialogo.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EditFuncionarioComponent } from './edit-funcionario/edit-funcionario.component';



@NgModule({
  declarations: [FuncionarioComponent, ListFuncioarioComponent, FuncionarioDetalleDialogoComponent, EditFuncionarioComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule
    ]
})
export class FuncionariosModule { }
