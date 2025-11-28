import { CommonModule, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../commons/core/material.module';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxQRCodeModule } from '@techiediaries/ngx-qrcode';
import { NgxCurrencyModule } from 'ngx-currency';
import { NgxImageCompressService } from 'ngx-image-compress';
import { ImageCropperModule } from 'ngx-image-cropper';
import { NgxPanZoomModule } from 'ngx-panzoom';
import { CapturarImagenComponent } from './capturar-imagen/capturar-imagen.component';
import { BotonComponent } from './components/boton/boton.component';
import { CargandoDialogComponent } from './components/cargando-dialog/cargando-dialog.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { DialogosComponent } from './components/dialogos/dialogos.component';
import { FooterComponent } from './components/footer/footer.component';
import { GenericListComponent } from './components/generic-list/generic-list.component';
import { HeaderComponent } from './components/header/header.component';
import { Imagebase64Component } from './components/imagebase64/imagebase64.component';
import { PanelLaterialInvisibleComponent } from './components/panel-laterial-invisible/panel-laterial-invisible.component';
import { SearchListDialogComponent } from './components/search-list-dialog/search-list-dialog.component';
import { SideComponent } from './components/side/side.component';
import { TecladoNumericoComponent } from './components/teclado-numerico/teclado-numerico.component';
import { CortarImagenDialogComponent } from './cortar-imagen-dialog/cortar-imagen-dialog.component';
import { DigitarContrasenaDialogComponent } from './digitar-contrasena-dialog/digitar-contrasena-dialog.component';
import { VizualizarImagenDialogComponent } from './images/vizualizar-imagen-dialog/vizualizar-imagen-dialog.component';
import { InnerDialogComponent } from './inner-dialog/inner-dialog.component';
import { QrCodeComponent } from './qr-code/qr-code.component';
import { ReportTestComponent } from './report-test/report-test.component';
import { SelectIconDialogComponent } from './select-icon-dialog/select-icon-dialog.component';
import { TimelineComponent } from './timeline/timeline.component';
import { CardComponent } from './widgets/card/card.component';
import { FileUploadComponent } from './widgets/file-upload/file-upload.component';
import { SearchBarDialogComponent } from './widgets/search-bar-dialog/search-bar-dialog.component';
import { IConfig, provideEnvironmentNgxMask } from 'ngx-mask';
import { Ng2FittextModule } from 'ng2-fittext';
import { DynamicFontSizeDirective } from './directives/dynamic-font-size.directive';
import { CopiarAClipboardDirective } from './directives/copiar-a-clipboard.directive';
import { BootstrapModule } from '../commons/core/bootstrap.module';
import { FrcSearchableSelectComponent } from './components/frc-searchable-select/frc-searchable-select.component';
import { FrcMultiDatepickerComponent } from './components/frc-multi-datepicker/frc-multi-datepicker.component';
import { PrevisualizarImgenDirective } from './directives/previsualizar-imagen.directive';
import { FrcToolTipRendererDirective } from './directives/frc-tool-tip-renderer.directive';
import { CustomToolTipComponent } from './components/frc-custom-tool-tip/frc-custom-tool-tip.component';
import { ResizableModule } from 'angular-resizable-element';
import { DialogoNuevasFuncionesComponent } from './components/dialogo-nuevas-funciones/dialogo-nuevas-funciones.component';
import { NumericOnlyDirective } from './directives/numeric-only.directive';
import { NoSpacesDirective } from './directives/no-spaces.directive';
import { LettersOnlyDirective } from './directives/letters-only.directive';
import { ShowAfterDelayDirective } from './directives/show-after-delay.directive';
import { FormattedTooltipDirective } from './directives/formatted-tooltip.directive';
import { MatTooltip } from '@angular/material/tooltip';
import { AutoFitTextDirective } from './directives/auto-fit-text-directive.directive';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DataDisplayComponent } from './data-display/data-display.component';
import { EnumToStringPipe } from '../commons/core/utils/pipes/enum-to-string';
import { A11yModule } from '@angular/cdk/a11y';
import { ConfiguracionFullDialogComponent } from './components/configuracion-full-dialog/configuracion-full-dialog.component';
import { ConfiguracionDialogComponent } from './components/configuracion-dialog/configuracion-dialog.component';
import { SideMiniVariantComponent } from './components/side-mini-variant/side-mini-variant.component';
import { NotificationBoardComponent } from './components/notification-board/notification-board.component';

export const options: Partial<IConfig> | (() => Partial<IConfig>) = null;

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
    ConfirmDialogComponent,
    TecladoNumericoComponent,
    Imagebase64Component,
    QrCodeComponent,
    CapturarImagenComponent,
    CortarImagenDialogComponent,
    SelectIconDialogComponent,
    PanelLaterialInvisibleComponent,
    VizualizarImagenDialogComponent,
    ReportTestComponent,
    InnerDialogComponent,
    SearchListDialogComponent,
    BotonComponent,
    SearchBarDialogComponent,
    TimelineComponent,
    DigitarContrasenaDialogComponent,
    CopiarAClipboardDirective,
    FrcSearchableSelectComponent,
    FrcMultiDatepickerComponent,
    PrevisualizarImgenDirective,
    FrcToolTipRendererDirective,
    CustomToolTipComponent,
    DialogoNuevasFuncionesComponent,
    NumericOnlyDirective,
    NoSpacesDirective,
    LettersOnlyDirective,
    ShowAfterDelayDirective,
    FormattedTooltipDirective,
    AutoFitTextDirective,
    DataDisplayComponent,
    ConfiguracionFullDialogComponent,
    ConfiguracionDialogComponent,
    SideMiniVariantComponent,
    NotificationBoardComponent
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
    NgxPanZoomModule,
    NgxQRCodeModule,
    Ng2FittextModule,
    BootstrapModule,
    NgxSpinnerModule
  ],
  exports: [
    HeaderComponent,
    SideComponent,
    SideMiniVariantComponent,
    FooterComponent,
    CardComponent,
    FileUploadComponent,
    GenericListComponent,
    DialogosComponent,
    ConfirmDialogComponent,
    Imagebase64Component,
    NgxCurrencyModule,
    NgxPanZoomModule,
    InnerDialogComponent,
    BotonComponent,
    TimelineComponent,
    DigitarContrasenaDialogComponent,
    CopiarAClipboardDirective,
    FrcSearchableSelectComponent,
    FrcMultiDatepickerComponent,
    PrevisualizarImgenDirective,
    FrcToolTipRendererDirective,
    CustomToolTipComponent,
    ResizableModule,
    DialogoNuevasFuncionesComponent,
    NumericOnlyDirective,
    NoSpacesDirective,
    LettersOnlyDirective,
    ShowAfterDelayDirective,
    FormattedTooltipDirective,
    NgxSpinnerModule,
    DataDisplayComponent,
    A11yModule,
    ConfiguracionDialogComponent,
    NotificationBoardComponent
  ],
  providers: [NgxImageCompressService, provideEnvironmentNgxMask(options), DecimalPipe, MatTooltip, TitleCasePipe, DatePipe, EnumToStringPipe]
})
export class SharedModule { }
