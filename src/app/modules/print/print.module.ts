import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintDesignComponent } from './print-design/print-design.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';



@NgModule({
  declarations: [
    PrintDesignComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule
  ],
  exports: [
    PrintDesignComponent
  ]
})
export class PrintModule { }
