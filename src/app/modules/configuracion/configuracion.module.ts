import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { ConfigurarServidorDialogComponent } from './configurar-servidor-dialog/configurar-servidor-dialog.component';
import { ListActualizacionComponent } from './actualizacion/list-actualizacion/list-actualizacion.component';
import { EditActualizacionComponent } from './actualizacion/edit-actualizacion/edit-actualizacion.component';
import { UpdateWizardComponent } from './actualizacion/update-wizard/update-wizard.component';



@NgModule({
  declarations: [ConfigurarServidorDialogComponent, ListActualizacionComponent, EditActualizacionComponent, UpdateWizardComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule
  ]
})
export class ConfiguracionModule { }
