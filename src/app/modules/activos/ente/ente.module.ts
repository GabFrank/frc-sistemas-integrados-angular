import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListBienesSucursalComponent } from './pages/list-bienes-sucursal/list-bienes-sucursal.component';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { FlexLayoutModule } from 'ngx-flexible-layout';

@NgModule({
  declarations: [
    ListBienesSucursalComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SharedModule,
    FlexLayoutModule
  ],
  exports: [
    ListBienesSucursalComponent
  ]
})
export class EnteModule { }
