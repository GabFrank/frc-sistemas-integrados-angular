import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListMarcacionComponent } from './marcacion/components/list-marcacion/list-marcacion.component';
import { MarcarHorarioComponent } from './marcacion/components/marcar-horario/marcar-horario.component';



@NgModule({
  declarations: [
    ListMarcacionComponent,
    MarcarHorarioComponent
  ],
  imports: [
    CommonModule
  ]
})
export class AdministrativoModule { }
