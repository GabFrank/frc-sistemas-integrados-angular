import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { ListConfiguracionRrhhComponent } from './configuracion-rrhh/list-configuracion-rrhh/list-configuracion-rrhh.component';
import { EditConfiguracionRrhhDialogComponent } from './configuracion-rrhh/edit-configuracion-rrhh-dialog/edit-configuracion-rrhh-dialog.component';
import { ConfigInfoDialogComponent } from './configuracion-rrhh/config-info-dialog/config-info-dialog.component';
import { ListFeriadoComponent } from './feriado/list-feriado/list-feriado.component';
import { EditFeriadoDialogComponent } from './feriado/edit-feriado-dialog/edit-feriado-dialog.component';
import { ListPenalizacionComponent } from './penalizacion/list-penalizacion/list-penalizacion.component';
import { EditPenalizacionDialogComponent } from './penalizacion/edit-penalizacion-dialog/edit-penalizacion-dialog.component';
import { ListHoraExtraComponent } from './hora-extra/list-hora-extra/list-hora-extra.component';
import { EditHoraExtraDialogComponent } from './hora-extra/edit-hora-extra-dialog/edit-hora-extra-dialog.component';
import { ListJornadaNovedadComponent } from './jornada-novedad/list-jornada-novedad/list-jornada-novedad.component';
import { EditJornadaNovedadDialogComponent } from './jornada-novedad/edit-jornada-novedad-dialog/edit-jornada-novedad-dialog.component';
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
import { CambioCargoDialogComponent } from './legajo/cambio-cargo-dialog/cambio-cargo-dialog.component';
import { CambioSalarioDialogComponent } from './legajo/cambio-salario-dialog/cambio-salario-dialog.component';
import { EgresarFuncionarioDialogComponent } from './legajo/egresar-funcionario-dialog/egresar-funcionario-dialog.component';
import { SubirDocumentoDialogComponent } from './legajo/subir-documento-dialog/subir-documento-dialog.component';
import { LiquidacionFinalDialogComponent } from './liquidacion-final/liquidacion-final-dialog/liquidacion-final-dialog.component';
import { DashboardRrhhComponent } from './dashboard/dashboard-rrhh.component';
import { ReportesRrhhComponent } from './reportes/reportes-rrhh.component';

@NgModule({
  declarations: [
    ListConfiguracionRrhhComponent,
    EditConfiguracionRrhhDialogComponent,
    ConfigInfoDialogComponent,
    ListFeriadoComponent,
    EditFeriadoDialogComponent,
    ListPenalizacionComponent,
    EditPenalizacionDialogComponent,
    ListHoraExtraComponent,
    EditHoraExtraDialogComponent,
    ListJornadaNovedadComponent,
    EditJornadaNovedadDialogComponent,
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
    CambioCargoDialogComponent,
    CambioSalarioDialogComponent,
    EgresarFuncionarioDialogComponent,
    SubirDocumentoDialogComponent,
    LiquidacionFinalDialogComponent,
    DashboardRrhhComponent,
    ReportesRrhhComponent
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
