import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MaterialModule } from '../../../commons/core/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { CuotasDetalleEditorComponent } from './components/cuotas-detalle-editor/cuotas-detalle-editor.component';
import { EnteArchivosPanelComponent } from './components/ente-archivos-panel/ente-archivos-panel.component';

@NgModule({
  declarations: [
    CuotasDetalleEditorComponent,
    EnteArchivosPanelComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    SharedModule,
    FlexLayoutModule,
  ],
  exports: [
    CuotasDetalleEditorComponent,
    EnteArchivosPanelComponent,
  ],
})
export class ActivosSharedModule {}
