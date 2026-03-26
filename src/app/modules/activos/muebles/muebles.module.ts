import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListMueblesComponent } from './pages/list-muebles/list-muebles.component';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { FlexLayoutModule } from 'ngx-flexible-layout';

@NgModule({
  declarations: [
    ListMueblesComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SharedModule,
    FlexLayoutModule
  ],
  exports: [
    ListMueblesComponent
  ]
})
export class MueblesModule { }
