import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BienesDashboardComponent } from './bienes-dashboard/bienes-dashboard.component';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { SharedModule } from '../../../shared/shared.module';
import { MaterialModule } from '../../../commons/core/material.module';
import { MueblesModule } from '../muebles/muebles.module';
import { InmuebleModule } from '../inmueble/inmueble.module';
import { EnteModule } from '../ente/ente.module';


@NgModule({
  declarations: [
    BienesDashboardComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    SharedModule,
    MaterialModule,
    MueblesModule,
    InmuebleModule,
    EnteModule
  ]
})
export class DashboardActivosModule { }
