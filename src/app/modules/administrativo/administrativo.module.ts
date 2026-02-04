import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';

import { SharedModule } from '../../shared/shared.module';
import { PersonasModule } from '../personas/personas.module';
import { MaterialModule } from '../../commons/core/material.module';

import { ListMarcacionComponent } from './marcacion/components/list-marcacion/list-marcacion.component';
import { MarcarHorarioComponent } from './marcacion/components/marcar-horario/marcar-horario.component';

@NgModule({
  declarations: [
    ListMarcacionComponent,
    MarcarHorarioComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    SharedModule,
    PersonasModule,
    MaterialModule
  ],
  exports: [
    ListMarcacionComponent,
    MarcarHorarioComponent
  ]
})
export class AdministrativoModule { }
