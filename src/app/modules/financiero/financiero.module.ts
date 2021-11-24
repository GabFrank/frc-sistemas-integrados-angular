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
