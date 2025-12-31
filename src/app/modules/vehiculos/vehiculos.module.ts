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

@NgModule({
  declarations: [
    VehiculoComponent,
    ListVehiculosComponent,
    PreRegistroVehiculoComponent,
    BuscarModeloDialogComponent,
    BuscarTipoVehiculoDialogComponent
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
