import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { BootstrapModule } from '../../../commons/core/bootstrap.module';

import { ListGastosComponent } from './pages/list-gastos/list-gastos.component';
import { ListTipoGastosComponent } from './pages/list-tipo-gastos/list-tipo-gastos.component';
import { ListPreGastosComponent } from './pages/list-pre-gastos/list-pre-gastos.component';
import { AdicionarTipoGastoDialogComponent } from './dialogs/adicionar-tipo-gasto-dialog/adicionar-tipo-gasto-dialog.component';
import { AdicionarGastoDialogComponent } from './dialogs/adicionar-gasto-dialog/adicionar-gasto-dialog.component';
import { AdicionarPreGastoDialogComponent } from './dialogs/adicionar-pre-gasto-dialog/adicionar-pre-gasto-dialog.component';
import { AutorizarGastoDialogComponent } from './dialogs/autorizar-gasto-dialog/autorizar-gasto-dialog.component';
import { AdicionarPreGastoComponent } from './pages/adicionar-pre-gasto/adicionar-pre-gasto.component';
import { GastosDashboardComponent } from './pages/gastos-dashboard/gastos-dashboard.component';

@NgModule({
  declarations: [
    ListGastosComponent,
    ListTipoGastosComponent,
    ListPreGastosComponent,
    AdicionarTipoGastoDialogComponent,
    AdicionarGastoDialogComponent,
    AdicionarPreGastoDialogComponent,
    AutorizarGastoDialogComponent,
    AdicionarPreGastoComponent,
    GastosDashboardComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    BootstrapModule
  ],
  exports: [
    ListGastosComponent,
    ListTipoGastosComponent,
    ListPreGastosComponent
  ]
})
export class GastosModule { }
