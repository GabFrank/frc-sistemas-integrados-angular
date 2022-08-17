import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ListPersonaComponent } from './persona/list-persona/list-persona.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PersonaComponent } from './persona/persona/persona.component';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { PersonaDetalleDialogoComponent } from './persona/persona-detalle-dialogo/persona-detalle-dialogo.component';
import { BuscarPersonaDialogComponent } from './persona/buscar-persona-dialog/buscar-persona-dialog.component';
import { AdicionarPersonaDialogComponent } from './persona/adicionar-persona-dialog/adicionar-persona-dialog.component';
import { AdicionarUsuarioDialogComponent } from './usuarios/adicionar-usuario-dialog/adicionar-usuario-dialog.component';
import { ListUsuarioComponent } from './usuarios/list-usuario/list-usuario.component';
import { UsuarioComponent } from './usuarios/usuario.component';
import { EditProveedorComponent } from './proveedor/edit-proveedor/edit-proveedor.component';
import { ListProveedorComponent } from './proveedor/list-proveedor/list-proveedor.component';
import { AdicionarFuncionarioDialogComponent } from './funcionarios/adicionar-funcionario-dialog/adicionar-funcionario-dialog.component';
import { FuncionarioWizardComponent } from './funcionarios/funcionario-wizard/funcionario-wizard.component';
import { ListFuncioarioComponent } from './funcionarios/list-funcioario/list-funcioario.component';
import { ListPreRegistroFuncionarioComponent } from './funcionarios/list-pre-registro-funcionario/list-pre-registro-funcionario.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FuncionarioDashboardComponent } from './funcionarios/funcionario-dashboard/funcionario-dashboard.component';
import { PersonasDashboardComponent } from './personas-dashboard/personas-dashboard.component';
import { AddClienteDialogComponent } from './clientes/add-cliente-dialog/add-cliente-dialog.component';


@NgModule({
  declarations: [
    ListPersonaComponent,
    PersonaComponent,
    PersonaDetalleDialogoComponent,
    BuscarPersonaDialogComponent,
    AdicionarPersonaDialogComponent,
    UsuarioComponent, ListUsuarioComponent, 
    AdicionarUsuarioDialogComponent,
    EditProveedorComponent, 
    ListProveedorComponent,
    ListFuncioarioComponent,
    AdicionarFuncionarioDialogComponent, 
    ListPreRegistroFuncionarioComponent, 
    FuncionarioWizardComponent,
    FuncionarioDashboardComponent,
    PersonasDashboardComponent,
    AddClienteDialogComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule
  ], 
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} }
  ]
})
export class PersonasModule { }
