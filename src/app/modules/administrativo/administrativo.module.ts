import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';

import { SharedModule } from '../../shared/shared.module';
import { PersonasModule } from '../personas/personas.module';
import { MaterialModule } from '../../commons/core/material.module';

import { ListMarcacionComponent } from './marcacion/components/list-marcacion/list-marcacion.component';
import { MarcarHorarioComponent } from './marcacion/components/marcar-horario/marcar-horario.component';
import { RelojHeaderComponent } from './marcacion/components/reloj-header/reloj-header.component';
import { CamaraReconocimientoComponent } from './marcacion/components/camara-reconocimiento/camara-reconocimiento.component';
import { ResumenMarcacionesComponent } from './marcacion/components/resumen-marcaciones/resumen-marcaciones.component';
import { EstadoMarcacionComponent } from './marcacion/components/estado-marcacion/estado-marcacion.component';
import { BusquedaUsuarioComponent } from './marcacion/components/busqueda-usuario/busqueda-usuario.component';

@NgModule({
  declarations: [
    ListMarcacionComponent,
    MarcarHorarioComponent,
    RelojHeaderComponent,
    CamaraReconocimientoComponent,
    ResumenMarcacionesComponent,
    EstadoMarcacionComponent,
    BusquedaUsuarioComponent
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
