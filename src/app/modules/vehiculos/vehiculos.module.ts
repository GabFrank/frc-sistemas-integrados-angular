import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculoComponent } from './vehiculo/dialogs/vehiculo-form/vehiculo.component';
import { ListVehiculosComponent } from './vehiculo/pages/list-vehiculos/list-vehiculos.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { PreRegistroVehiculoComponent } from './vehiculo/dialogs/pre-registro/pre-registro-vehiculo.component';
import { VehiculoSucursalDialogComponent } from './vehiculo/dialogs/vehiculo-sucursal-dialog/vehiculo-sucursal-dialog.component';
import { VehiculosDashboardComponent } from './vehiculos-dashboard/vehiculos-dashboard.component';
import { AdicionarTipoVehiculoDialogComponent } from './vehiculo/dialogs/adicionar-tipo-vehiculo-dialog/adicionar-tipo-vehiculo-dialog.component';
import { AdicionarModeloDialogComponent } from './vehiculo/dialogs/adicionar-modelo-dialog/adicionar-modelo-dialog.component';
import { ListVehiculoSucursalComponent } from './vehiculo/pages/list-vehiculo-sucursal/list-vehiculo-sucursal.component';
import { ListGpsComponent } from './gps/pages/list-gps/list-gps.component';
import { GpsComponent } from './gps/dialogs/gps-form/gps.component';
import { GpsConfigDialogComponent } from './gps/dialogs/gps-config-dialog/gps-config-dialog.component';
import { ListMapasComponent } from './gps/pages/list-mapas/list-mapas.component';
@NgModule({
  declarations: [
    VehiculoComponent,
    ListVehiculosComponent,
    PreRegistroVehiculoComponent,
    VehiculoSucursalDialogComponent,
    VehiculosDashboardComponent,
    ListVehiculoSucursalComponent,
    AdicionarTipoVehiculoDialogComponent,
    AdicionarModeloDialogComponent,
    ListGpsComponent,
    GpsComponent,
    ListMapasComponent,
    GpsConfigDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FlexLayoutModule,
    MaterialModule,
    SharedModule
  ],
  exports: [
    ListVehiculosComponent
  ]
})
export class VehiculosModule { }
