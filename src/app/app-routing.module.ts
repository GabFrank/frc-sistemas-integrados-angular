import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DefaultComponent } from './layouts/default/default.component';
import { CapturarImagenComponent } from './shared/capturar-imagen/capturar-imagen.component';

const routes: Routes = [
  {
    path: '',
    component: DefaultComponent,
  },
  {path: "capturar", component: CapturarImagenComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
