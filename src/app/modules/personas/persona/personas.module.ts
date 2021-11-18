import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ListPersonaComponent } from './list-persona/list-persona.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PersonaComponent } from './persona/persona.component';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { PersonaDetalleDialogoComponent } from './persona-detalle-dialogo/persona-detalle-dialogo.component';
import { BuscarPersonaDialogComponent } from './buscar-persona-dialog/buscar-persona-dialog.component';
import { AdicionarPersonaDialogComponent } from './adicionar-persona-dialog/adicionar-persona-dialog.component';


@NgModule({
  declarations: [
    ListPersonaComponent,
    PersonaComponent,
    PersonaDetalleDialogoComponent,
    BuscarPersonaDialogComponent,
    AdicionarPersonaDialogComponent
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
export class PersonasModule { }
