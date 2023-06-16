import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesComponent } from './reportes.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';


@NgModule({
  declarations: [ReportesComponent],
  imports: [
    CommonModule,
    NgxExtendedPdfViewerModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule
  ],
  exports: [ReportesComponent]
})
export class ReportesModule { }
