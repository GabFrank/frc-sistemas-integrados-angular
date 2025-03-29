import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ListReplicationTablesComponent } from './logical-replication/list-replication-tables/list-replication-tables.component';
import { ListReplicationComponent } from './logical-replication/list-replication/list-replication.component';

const routes: Routes = [
  // ... existing routes

  {
    path: 'replication-tables',
    component: ListReplicationTablesComponent,
    // ... any canActivate guards, etc.
  },
  {
    path: 'logical-replication',
    component: ListReplicationComponent,
    // ... any canActivate guards, etc.
  },

  // ... existing routes
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ConfiguracionRoutingModule { } 