import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { ProductoModule } from './productos/productos.module';
import { PersonasModule } from './personas/persona/personas.module';
import { UsuarioModule } from './personas/usuarios/usuario.module';
import { OperacionesModule } from './operaciones/operaciones.module';
import { PdvModule } from './pdv/pdv.module';
import { GeneralModule } from './general/general.module';
import { FuncionariosModule } from './personas/funcionarios/funcionarios.module';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { LoginModule } from './login/login.module';
import { PrintModule } from './print/print.module';
import { FinancieroModule } from './financiero/financiero.module';
import { ReportesModule } from './reportes/reportes/reportes.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';



@NgModule({
  declarations: [
        ],
  imports: [
    CommonModule,
    DashboardModule,
    PersonasModule,
    UsuarioModule,
    ProductoModule,
    OperacionesModule,
    PdvModule,
    GeneralModule,
    FuncionariosModule,
    LoginModule,
    PrintModule,
    FinancieroModule,
    ReportesModule,
    ConfiguracionModule,
    MDBBootstrapModule.forRoot()
  ],
  providers: [
  ]
})
export class ModulesModule { }
