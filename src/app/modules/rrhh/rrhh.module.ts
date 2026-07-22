import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { ListConfiguracionRrhhComponent } from './configuracion-rrhh/list-configuracion-rrhh/list-configuracion-rrhh.component';
import { EditConfiguracionRrhhDialogComponent } from './configuracion-rrhh/edit-configuracion-rrhh-dialog/edit-configuracion-rrhh-dialog.component';
import { ConfigInfoDialogComponent } from './configuracion-rrhh/config-info-dialog/config-info-dialog.component';
import { AjusteSalarioMinimoDialogComponent } from './configuracion-rrhh/ajuste-salario-minimo-dialog/ajuste-salario-minimo-dialog.component';
import { ListFeriadoComponent } from './feriado/list-feriado/list-feriado.component';
import { EditFeriadoDialogComponent } from './feriado/edit-feriado-dialog/edit-feriado-dialog.component';
import { ListPenalizacionComponent } from './penalizacion/list-penalizacion/list-penalizacion.component';
import { EditPenalizacionDialogComponent } from './penalizacion/edit-penalizacion-dialog/edit-penalizacion-dialog.component';
import { GenerarPenalizacionesDialogComponent } from './penalizacion/generar-penalizaciones-dialog/generar-penalizaciones-dialog.component';
import { ListHoraExtraComponent } from './hora-extra/list-hora-extra/list-hora-extra.component';
import { EditHoraExtraDialogComponent } from './hora-extra/edit-hora-extra-dialog/edit-hora-extra-dialog.component';
import { ListJustificativoComponent } from './justificativo/list-justificativo/list-justificativo.component';
import { EditJustificativoDialogComponent } from './justificativo/edit-justificativo-dialog/edit-justificativo-dialog.component';
import { ListTipoJustificativoComponent } from './tipo-justificativo/list-tipo-justificativo/list-tipo-justificativo.component';
import { EditTipoJustificativoDialogComponent } from './tipo-justificativo/edit-tipo-justificativo-dialog/edit-tipo-justificativo-dialog.component';
import { ListMotivoValeComponent } from './motivo-vale/list-motivo-vale/list-motivo-vale.component';
import { EditMotivoValeDialogComponent } from './motivo-vale/edit-motivo-vale-dialog/edit-motivo-vale-dialog.component';
import { ListValeComponent } from './vale/list-vale/list-vale.component';
import { EditValeDialogComponent } from './vale/edit-vale-dialog/edit-vale-dialog.component';
import { ConfirmarValeDialogComponent } from './vale/confirmar-vale-dialog/confirmar-vale-dialog.component';
import { ListPrestamoComponent } from './prestamo/list-prestamo/list-prestamo.component';
import { EditPrestamoDialogComponent } from './prestamo/edit-prestamo-dialog/edit-prestamo-dialog.component';
import { PrestamoCuotasDialogComponent } from './prestamo/prestamo-cuotas-dialog/prestamo-cuotas-dialog.component';
import { ListVacacionComponent } from './vacacion/list-vacacion/list-vacacion.component';
import { GestionVacacionDialogComponent } from './vacacion/gestion-vacacion-dialog/gestion-vacacion-dialog.component';
import { ListAguinaldoComponent } from './aguinaldo/list-aguinaldo/list-aguinaldo.component';
import { ListBonoComponent } from './bono/list-bono/list-bono.component';
import { EditBonoDialogComponent } from './bono/edit-bono-dialog/edit-bono-dialog.component';
import { ListLiquidacionComponent } from './liquidacion/list-liquidacion/list-liquidacion.component';
import { GenerarLiquidacionDialogComponent } from './liquidacion/generar-liquidacion-dialog/generar-liquidacion-dialog.component';
import { LiquidacionDetalleDialogComponent } from './liquidacion/liquidacion-detalle-dialog/liquidacion-detalle-dialog.component';
import { LegajoFuncionarioComponent } from './legajo/legajo-funcionario/legajo-funcionario.component';
import { LegajoMetricaDialogComponent } from './legajo/legajo-metrica-dialog/legajo-metrica-dialog.component';
import { DocumentoViewerDialogComponent } from './legajo/documento-viewer-dialog/documento-viewer-dialog.component';
import { CambioCargoDialogComponent } from './legajo/cambio-cargo-dialog/cambio-cargo-dialog.component';
import { CambioSalarioDialogComponent } from './legajo/cambio-salario-dialog/cambio-salario-dialog.component';
import { EgresarFuncionarioDialogComponent } from './legajo/egresar-funcionario-dialog/egresar-funcionario-dialog.component';
import { SubirDocumentoDialogComponent } from './legajo/subir-documento-dialog/subir-documento-dialog.component';
import { LiquidacionFinalDialogComponent } from './liquidacion-final/liquidacion-final-dialog/liquidacion-final-dialog.component';
import { DashboardRrhhComponent } from './dashboard/dashboard-rrhh.component';
import { ReportesRrhhComponent } from './reportes/reportes-rrhh.component';
import { ManualRrhhComponent } from './manual/manual-rrhh.component';

@NgModule({
  declarations: [
    ListConfiguracionRrhhComponent,
    EditConfiguracionRrhhDialogComponent,
    ConfigInfoDialogComponent,
    AjusteSalarioMinimoDialogComponent,
    ListFeriadoComponent,
    EditFeriadoDialogComponent,
    ListPenalizacionComponent,
    EditPenalizacionDialogComponent,
    GenerarPenalizacionesDialogComponent,
    ListHoraExtraComponent,
    EditHoraExtraDialogComponent,
    ListJustificativoComponent,
    EditJustificativoDialogComponent,
    ListTipoJustificativoComponent,
    EditTipoJustificativoDialogComponent,
    ListMotivoValeComponent,
    EditMotivoValeDialogComponent,
    ListValeComponent,
    EditValeDialogComponent,
    ConfirmarValeDialogComponent,
    ListPrestamoComponent,
    EditPrestamoDialogComponent,
    PrestamoCuotasDialogComponent,
    ListVacacionComponent,
    GestionVacacionDialogComponent,
    ListAguinaldoComponent,
    ListBonoComponent,
    EditBonoDialogComponent,
    ListLiquidacionComponent,
    GenerarLiquidacionDialogComponent,
    LiquidacionDetalleDialogComponent,
    LegajoFuncionarioComponent,
    LegajoMetricaDialogComponent,
    DocumentoViewerDialogComponent,
    CambioCargoDialogComponent,
    CambioSalarioDialogComponent,
    EgresarFuncionarioDialogComponent,
    SubirDocumentoDialogComponent,
    LiquidacionFinalDialogComponent,
    DashboardRrhhComponent,
    ReportesRrhhComponent,
    ManualRrhhComponent
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
export class RrhhModule { }
