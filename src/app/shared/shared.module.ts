import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../commons/core/material.module';
import { FlexLayoutModule } from '@angular/flex-layout';

import { CardComponent } from './widgets/card/card.component';
import { FileUploadComponent } from './widgets/file-upload/file-upload.component';
import { HeaderComponent } from './components/header/header.component';
import { SideComponent } from './components/side/side.component';
import { FooterComponent } from './components/footer/footer.component';
import { GenericListComponent } from './components/generic-list/generic-list.component';
import { DialogosComponent } from './components/dialogos/dialogos.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CargandoDialogComponent } from './components/cargando-dialog/cargando-dialog.component';
import { TecladoNumericoComponent } from './components/teclado-numerico/teclado-numerico.component';
import { Imagebase64Component } from './components/imagebase64/imagebase64.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { QrCodeComponent } from './qr-code/qr-code.component';
import { CapturarImagenComponent } from './capturar-imagen/capturar-imagen.component';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgxImageCompressService } from 'ngx-image-compress';
import { CortarImagenDialogComponent } from './cortar-imagen-dialog/cortar-imagen-dialog.component';
import { SelectIconDialogComponent } from './select-icon-dialog/select-icon-dialog.component';
import { PanelLaterialInvisibleComponent } from './components/panel-laterial-invisible/panel-laterial-invisible.component';
import { VizualizarImagenDialogComponent } from './images/vizualizar-imagen-dialog/vizualizar-imagen-dialog.component';
import { ReportTestComponent } from './report-test/report-test.component';
import { NgxPanZoomModule } from 'ngx-panzoom';


@NgModule({
  declarations: [
    HeaderComponent,
    SideComponent,
    FooterComponent,
    CardComponent,
    FileUploadComponent,
    GenericListComponent,
    DialogosComponent,
    CargandoDialogComponent,
    TecladoNumericoComponent,
    Imagebase64Component,
    QrCodeComponent,
    CapturarImagenComponent,
    CortarImagenDialogComponent,
    SelectIconDialogComponent,
    PanelLaterialInvisibleComponent,
    VizualizarImagenDialogComponent,
    ReportTestComponent,
    ],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NgxCurrencyModule,
    ImageCropperModule,
    NgxPanZoomModule
    ],
  exports: [
    HeaderComponent,
    SideComponent,
    FooterComponent,
    CardComponent,
    FileUploadComponent,
    GenericListComponent,
    DialogosComponent,
    Imagebase64Component,
    NgxCurrencyModule,
    NgxPanZoomModule
  ],
  providers: [NgxImageCompressService]
})
export class SharedModule { }
