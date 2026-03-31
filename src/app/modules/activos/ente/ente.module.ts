import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListBienesSucursalComponent } from './pages/list-bienes-sucursal/list-bienes-sucursal.component';
import { EnteSucursalDialogComponent } from './dialogs/ente-sucursal-dialog/ente-sucursal-dialog.component';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    ListBienesSucursalComponent,
    EnteSucursalDialogComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SharedModule,
    FlexLayoutModule,
    ReactiveFormsModule
  ],
  exports: [
    ListBienesSucursalComponent
  ]
})
export class EnteModule { }
