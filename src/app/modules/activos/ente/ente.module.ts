import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListBienesSucursalComponent } from './pages/list-bienes-sucursal/list-bienes-sucursal.component';
import { EnteSucursalDialogComponent } from './dialogs/ente-sucursal-dialog/ente-sucursal-dialog.component';
import { EnteVinculacionDialogComponent } from './dialogs/ente-vinculacion-dialog/ente-vinculacion-dialog.component';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivosSharedModule } from '../shared/activos-shared.module';

@NgModule({
  declarations: [
    ListBienesSucursalComponent,
    EnteSucursalDialogComponent,
    EnteVinculacionDialogComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SharedModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    ActivosSharedModule,
  ],
  exports: [
    ListBienesSucursalComponent
  ]
})
export class EnteModule { }
