import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { ListConfiguracionRrhhComponent } from './configuracion-rrhh/list-configuracion-rrhh/list-configuracion-rrhh.component';
import { EditConfiguracionRrhhDialogComponent } from './configuracion-rrhh/edit-configuracion-rrhh-dialog/edit-configuracion-rrhh-dialog.component';
import { ListFeriadoComponent } from './feriado/list-feriado/list-feriado.component';
import { EditFeriadoDialogComponent } from './feriado/edit-feriado-dialog/edit-feriado-dialog.component';
import { ListPenalizacionComponent } from './penalizacion/list-penalizacion/list-penalizacion.component';
import { EditPenalizacionDialogComponent } from './penalizacion/edit-penalizacion-dialog/edit-penalizacion-dialog.component';
import { ListHoraExtraComponent } from './hora-extra/list-hora-extra/list-hora-extra.component';
import { EditHoraExtraDialogComponent } from './hora-extra/edit-hora-extra-dialog/edit-hora-extra-dialog.component';
import { ListJornadaNovedadComponent } from './jornada-novedad/list-jornada-novedad/list-jornada-novedad.component';
import { EditJornadaNovedadDialogComponent } from './jornada-novedad/edit-jornada-novedad-dialog/edit-jornada-novedad-dialog.component';

@NgModule({
  declarations: [
    ListConfiguracionRrhhComponent,
    EditConfiguracionRrhhDialogComponent,
    ListFeriadoComponent,
    EditFeriadoDialogComponent,
    ListPenalizacionComponent,
    EditPenalizacionDialogComponent,
    ListHoraExtraComponent,
    EditHoraExtraDialogComponent,
    ListJornadaNovedadComponent,
    EditJornadaNovedadDialogComponent
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
