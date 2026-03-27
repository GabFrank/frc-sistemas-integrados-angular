import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListInmueblesComponent } from './pages/list-inmuebles/list-inmuebles.component';
import { InmuebleFormComponent } from './dialogs/inmueble-form/inmueble-form.component';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ListInmueblesComponent,
    InmuebleFormComponent
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
    ListInmueblesComponent
  ]
})
export class InmuebleModule { }
