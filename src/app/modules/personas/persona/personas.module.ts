import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ListPersonaComponent } from './list-persona/list-persona.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PersonaComponent } from './persona/persona.component';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { PersonaDetalleDialogoComponent } from './persona-detalle-dialogo/persona-detalle-dialogo.component';


@NgModule({
  declarations: [
    ListPersonaComponent,
    PersonaComponent,
    PersonaDetalleDialogoComponent
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
