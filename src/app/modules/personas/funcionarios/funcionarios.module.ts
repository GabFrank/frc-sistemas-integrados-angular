import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListFuncioarioComponent } from './list-funcioario/list-funcioario.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { AdicionarFuncionarioDialogComponent } from './adicionar-funcionario-dialog/adicionar-funcionario-dialog.component';




@NgModule({
  declarations: [ListFuncioarioComponent, AdicionarFuncionarioDialogComponent],
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
