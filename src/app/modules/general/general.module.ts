import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { ListPaisComponent } from './pais/list-pais/list-pais.component';
import { PaisComponent } from './pais/pais/pais.component';
import { ListCiudadComponent } from './ciudad/list-ciudad/list-ciudad.component';
import { FlexLayoutModule } from 'ngx-flexible-layout';



@NgModule({
  declarations: [
    ListPaisComponent,
    PaisComponent,
    ListCiudadComponent
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
export class GeneralModule { }
