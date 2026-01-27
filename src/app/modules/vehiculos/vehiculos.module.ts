import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculoComponent } from './vehiculo/vehiculo-form/vehiculo.component';
import { ListVehiculosComponent } from './vehiculo/list-vehiculos/list-vehiculos.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { PreRegistroVehiculoComponent } from './vehiculo/pre-registro/pre-registro-vehiculo.component';
import { BuscarModeloDialogComponent } from './vehiculo/buscar-modelo-dialog/buscar-modelo-dialog.component';
import { BuscarTipoVehiculoDialogComponent } from './vehiculo/buscar-tipo-vehiculo-dialog/buscar-tipo-vehiculo-dialog.component';
import { VehiculoSucursalDialogComponent } from './vehiculo/vehiculo-sucursal-dialog/vehiculo-sucursal-dialog.component';
import { VehiculosDashboardComponent } from './vehiculos-dashboard/vehiculos-dashboard.component';
import { ListVehiculoSucursalComponent } from './vehiculo-sucursal/list-vehiculo-sucursal/list-vehiculo-sucursal.component';
import { AdicionarTipoVehiculoDialogComponent } from './vehiculo/adicionar-tipo-vehiculo-dialog/adicionar-tipo-vehiculo-dialog.component';
import { AdicionarModeloDialogComponent } from './vehiculo/adicionar-modelo-dialog/adicionar-modelo-dialog.component';
import { ListGpsComponent } from './list-gps/list-gps.component';
import { GpsComponent } from './vehiculo/gps-form/gps.component';
import { BuscarVehiculoDialogComponent } from './vehiculo/buscar-vehiculo-dialog/buscar-vehiculo-dialog.component';
import { ListMapasComponent } from './list-mapas/list-mapas.component';
@NgModule({
  declarations: [
    VehiculoComponent,
    ListVehiculosComponent,
    PreRegistroVehiculoComponent,
    BuscarModeloDialogComponent,
    BuscarTipoVehiculoDialogComponent,
    BuscarVehiculoDialogComponent,
    VehiculoSucursalDialogComponent,
    VehiculosDashboardComponent,
    ListVehiculoSucursalComponent,
    AdicionarTipoVehiculoDialogComponent,
    AdicionarModeloDialogComponent,
    ListGpsComponent,
    GpsComponent,
    ListMapasComponent
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
