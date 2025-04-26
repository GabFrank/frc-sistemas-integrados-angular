import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioDashboardComponent } from './inventario-dashboard/inventario-dashboard.component';
import { ListInventarioComponent } from './list-inventario/list-inventario.component';
import { EditInventarioComponent } from './edit-inventario/edit-inventario.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { CreateInventarioDialogComponent } from './create-inventario-dialog/create-inventario-dialog.component';
import { AddProductoDialogComponent } from './add-producto-dialog/add-producto-dialog.component';
import { FlexLayoutModule } from 'ngx-flexible-layout';

@NgModule({
  declarations: [
    InventarioDashboardComponent,
    ListInventarioComponent,
    EditInventarioComponent,
    CreateInventarioDialogComponent,
    AddProductoDialogComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule
  ]
})
export class InventarioModule { }
