import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { ListEquiposComponent } from './pages/list-equipos/list-equipos.component';
import { EquipoFormComponent } from './dialogs/equipo-form/equipo-form.component';
import { AdicionarTipoEquipoDialogComponent } from './dialogs/adicionar-tipo-equipo-dialog/adicionar-tipo-equipo-dialog.component';
import { AdicionarModeloEquipoDialogComponent } from './dialogs/adicionar-modelo-equipo-dialog/adicionar-modelo-equipo-dialog.component';

@NgModule({
  declarations: [
    ListEquiposComponent,
    EquipoFormComponent,
    AdicionarTipoEquipoDialogComponent,
    AdicionarModeloEquipoDialogComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SharedModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [
    ListEquiposComponent
  ]
})
export class EquipoModule { }
