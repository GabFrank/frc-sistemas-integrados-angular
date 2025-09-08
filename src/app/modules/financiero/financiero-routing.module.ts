import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DteListComponent } from './dte/dte-list/dte-list.component';

const routes: Routes = [
  { path: 'dte', component: DteListComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinancieroRoutingModule {}


