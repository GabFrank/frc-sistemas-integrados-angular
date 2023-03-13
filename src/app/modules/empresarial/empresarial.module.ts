import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListSectorComponent } from './sector/list-sector/list-sector.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { InventarioModule } from '../operaciones/inventario/inventario.module';
import { AdicionarZonaDialogComponent } from './zona/adicionar-zona-dialog/adicionar-zona-dialog.component';
import { AdicionarSectorDialogComponent } from './sector/adicionar-sector-dialog/adicionar-sector-dialog.component';



@NgModule({
  declarations: [
    ListSectorComponent,
    AdicionarZonaDialogComponent,
    AdicionarSectorDialogComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    InventarioModule,
    NgxMaskModule.forRoot(),
  ]
})
export class EmpresarialModule { }
