import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DteListComponent } from './dte/dte-list/dte-list.component';
import { DteTestComponent } from './dte/dte-test.component';

const routes: Routes = [
  { path: 'dte', component: DteListComponent },
  { path: 'dte/test', component: DteTestComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinancieroRoutingModule {}


