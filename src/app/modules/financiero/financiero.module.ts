import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BancoComponent } from "./banco/banco.component";
import { CambioComponent } from "./cambio/cambio.component";
import { CuentaBancaria } from "./cuenta-bancaria/cuenta-bancaria.model";
import { CuentaBancariaComponent } from "./cuenta-bancaria/cuenta-bancaria.component";
import { FinancieroDashboardComponent } from "./financiero-dashboard/financiero-dashboard.component";
import { FormaPagoComponent } from "./forma-pago/forma-pago.component";
import { MaletinComponent } from "./maletin/maletin.component";
import { MonedaComponent } from "./moneda/moneda.component";
import { ListCajaComponent } from "./pdv/caja/list-caja/list-caja.component";
import { FlexLayoutModule } from "@angular/flex-layout";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../commons/core/material.module";
import { SharedModule } from "../../shared/shared.module";
import { ListMaletinComponent } from './maletin/list-maletin/list-maletin.component';
import { AdicionarMaletinDialogComponent } from './maletin/adicionar-maletin-dialog/adicionar-maletin-dialog.component';
import { ListGastosComponent } from './gastos/list-gastos/list-gastos.component';
import { ListTipoGastosComponent } from './tipo-gastos/list-tipo-gastos/list-tipo-gastos.component';
import { AdicionarTipoGastoDialogComponent } from './tipo-gastos/adicionar-tipo-gasto-dialog/adicionar-tipo-gasto-dialog.component';
import { AdicionarCajaDialogComponent } from './pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component';
import { SinMaletinDialogComponent } from './pdv/sin-maletin-dialog/sin-maletin-dialog.component';
import { AdicionarConteoDialogComponent } from './conteo/adicionar-conteo-dialog/adicionar-conteo-dialog.component';
import { AdicionarRetiroDialogComponent } from './retiro/adicionar-retiro-dialog/adicionar-retiro-dialog.component';
import { ListRetiroComponent } from './retiro/list-retiro/list-retiro.component';
import { AdicionarGastoDialogComponent } from './gastos/adicionar-gasto-dialog/adicionar-gasto-dialog.component';
import { CrearCambioDialogComponent } from './cambio/crear-cambio-dialog/crear-cambio-dialog.component';

@NgModule({
  declarations: [
    BancoComponent,
    CambioComponent,
    CuentaBancariaComponent,
    FinancieroDashboardComponent,
    FormaPagoComponent,
    MaletinComponent,
    MonedaComponent,
    ListCajaComponent,
    ListMaletinComponent,
    AdicionarMaletinDialogComponent,
    ListGastosComponent,
    ListTipoGastosComponent,
    AdicionarTipoGastoDialogComponent,
    AdicionarCajaDialogComponent,
    SinMaletinDialogComponent,
    AdicionarConteoDialogComponent,
    AdicionarRetiroDialogComponent,
    ListRetiroComponent,
    AdicionarGastoDialogComponent,
    CrearCambioDialogComponent,
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
  ],
})
export class FinancieroModule {}
