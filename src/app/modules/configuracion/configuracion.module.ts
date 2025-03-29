import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { ConfigurarServidorDialogComponent } from './configurar-servidor-dialog/configurar-servidor-dialog.component';
import { ListActualizacionComponent } from './actualizacion/list-actualizacion/list-actualizacion.component';
import { EditActualizacionComponent } from './actualizacion/edit-actualizacion/edit-actualizacion.component';
import { UpdateWizardComponent } from './actualizacion/update-wizard/update-wizard.component';
import { ListRolesComponent } from './roles/list-roles/list-roles.component';
import { AdicionarRoleDialogComponent } from './roles/adicionar-role-dialog/adicionar-role-dialog.component';
import { AdicionarGrupoRoleDialogComponent } from './roles/adicionar-grupo-role-dialog/adicionar-grupo-role-dialog.component';
import { SolicitarRecursosDialogComponent } from './solicitar-recursos-dialog/solicitar-recursos-dialog.component';
import { ThermalPrinterModule } from './thermal-printer/thermal-printer.module';
import { ListReplicationComponent } from './logical-replication/list-replication/list-replication.component';
import { LogicalReplicationService } from './logical-replication/logical-replication.service';
import { EditRemotePublicationDialogComponent } from './logical-replication/edit-remote-publication-dialog/edit-remote-publication-dialog.component';
import { EditRemoteSubscriptionDialogComponent } from './logical-replication/edit-remote-subscription-dialog/edit-remote-subscription-dialog.component';
import { ConfiguracionRoutingModule } from './configuracion-routing.module';
import { ListReplicationTablesComponent } from './logical-replication/list-replication-tables/list-replication-tables.component';
import { EditReplicationTableDialogComponent } from './logical-replication/edit-replication-table-dialog/edit-replication-table-dialog.component';

@NgModule({
  declarations: [
    ConfigurarServidorDialogComponent, 
    ListActualizacionComponent, 
    EditActualizacionComponent, 
    UpdateWizardComponent, 
    ListRolesComponent, 
    AdicionarRoleDialogComponent, 
    AdicionarGrupoRoleDialogComponent, 
    SolicitarRecursosDialogComponent,
    ListReplicationComponent,
    EditRemotePublicationDialogComponent,
    EditRemoteSubscriptionDialogComponent,
    ListReplicationTablesComponent,
    EditReplicationTableDialogComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    ThermalPrinterModule,
    ConfiguracionRoutingModule
  ],
  providers: [
    LogicalReplicationService
  ],
  exports: [
    ListReplicationComponent,
    ListReplicationTablesComponent
  ]
})
export class ConfiguracionModule { }
