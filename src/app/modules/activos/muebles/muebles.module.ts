import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListMueblesComponent } from './pages/list-muebles/list-muebles.component';
import { MuebleFormComponent } from './dialogs/mueble-form/mueble-form.component';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AdicionarFamiliaMuebleDialogComponent } from './dialogs/adicionar-familia-mueble-dialog/adicionar-familia-mueble-dialog.component';
import { AdicionarTipoMuebleDialogComponent } from './dialogs/adicionar-tipo-mueble-dialog/adicionar-tipo-mueble-dialog.component';

@NgModule({
  declarations: [
    ListMueblesComponent,
    MuebleFormComponent,
    AdicionarFamiliaMuebleDialogComponent,
    AdicionarTipoMuebleDialogComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    SharedModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: [
    ListMueblesComponent
  ]
})
export class MueblesModule { }
