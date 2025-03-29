import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListSectorComponent } from './sector/list-sector/list-sector.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { InventarioModule } from '../operaciones/inventario/inventario.module';
import { AdicionarZonaDialogComponent } from './zona/adicionar-zona-dialog/adicionar-zona-dialog.component';
import { AdicionarSectorDialogComponent } from './sector/adicionar-sector-dialog/adicionar-sector-dialog.component';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ListSucursalComponent } from './sucursal/list-sucursal/list-sucursal.component';
import { EditSucursalDialogComponent } from './sucursal/edit-sucursal-dialog/edit-sucursal-dialog.component';


@NgModule({
  declarations: [
    ListSectorComponent,
    AdicionarZonaDialogComponent,
    AdicionarSectorDialogComponent,
    ListSucursalComponent,
    EditSucursalDialogComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    InventarioModule
  ]
})
export class EmpresarialModule { }
