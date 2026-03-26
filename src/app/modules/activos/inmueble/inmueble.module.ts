import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListInmueblesComponent } from './pages/list-inmuebles/list-inmuebles.component';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { FlexLayoutModule } from 'ngx-flexible-layout';

@NgModule({
  declarations: [
    ListInmueblesComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SharedModule,
    FlexLayoutModule
  ],
  exports: [
    ListInmueblesComponent
  ]
})
export class InmuebleModule { }
