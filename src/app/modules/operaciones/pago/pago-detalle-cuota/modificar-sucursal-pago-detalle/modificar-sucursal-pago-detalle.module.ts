import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../../../commons/core/material.module';
import { ModificarSucursalPagoDetalleComponent } from './modificar-sucursal-pago-detalle.component';

@NgModule({
  declarations: [
    ModificarSucursalPagoDetalleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  exports: [
    ModificarSucursalPagoDetalleComponent
  ]
})
export class ModificarSucursalPagoDetalleModule { } 