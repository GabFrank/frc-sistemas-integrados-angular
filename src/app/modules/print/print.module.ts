import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintDesignComponent } from './print-design/print-design.component';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { PrintTicketsComponent } from './print-tickets/print-tickets.component';
import { NgxBarcodeModule } from 'ngx-barcode';



@NgModule({
  declarations: [
    PrintDesignComponent,
    PrintTicketsComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    NgxBarcodeModule
  ],
  exports: [
    PrintDesignComponent
  ]
})
export class PrintModule { }
