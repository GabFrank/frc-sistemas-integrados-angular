import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BancoComponent } from "./banco/banco.component";
import { CambioComponent } from "./cambio/cambio.component";
import { CuentaBancariaComponent } from "./cuenta-bancaria/cuenta-bancaria.component";
import { FinancieroDashboardComponent } from "./financiero-dashboard/financiero-dashboard.component";
import { FormaPagoComponent } from "./forma-pago/forma-pago.component";
import { MaletinComponent } from "./maletin/maletin.component";
import { MonedaComponent } from "./moneda/moneda.component";
import { ListCajaComponent } from "./pdv/caja/list-caja/list-caja.component";
import { FlexLayoutModule } from "ngx-flexible-layout";
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
import { MostrarBalanceDialogComponent } from './pdv/caja/mostrar-balance-dialog/mostrar-balance-dialog.component';
import { ListFacturaLegalComponent } from './factura-legal/list-factura-legal/list-factura-legal.component';
import { AddFacturaLegalDialogComponent } from './factura-legal/add-factura-legal-dialog/add-factura-legal-dialog.component';
import { EditFacturaLegalDialogComponent } from './factura-legal/edit-factura-legal-dialog/edit-factura-legal-dialog.component';
import { EditFacturaLegalItemComponent } from './factura-legal/edit-factura-legal-item/edit-factura-legal-item.component';
import { AddVentaCreditoDialogComponent } from './venta-credito/add-venta-credito-dialog/add-venta-credito-dialog.component';
import { ListVentaCreditoComponent } from './venta-credito/list-venta-credito/list-venta-credito.component';
import { FinancieroConfiguracionDialogComponent } from './financiero-configuracion-dialog/financiero-configuracion-dialog.component';
import { AddCajaCategoriaObsDialogComponent } from "./pdv/caja-categoria-observacion/add-caja-categoria-obs-dialog/add-caja-categoria-obs-dialog.component";
import { AddCajaSubCategoriaObsDialogComponent } from "./pdv/caja-subcategoria-observacion/add-caja-subcategoria-obs-dialog/add-caja-subcategoria-obs-dialog.component";
import { AddCajaMotivoObsDialogComponent } from './pdv/caja-motivo-observacion/add-caja-motivo-obs-dialog/add-caja-motivo-obs-dialog.component';
import { AddCajaObservacionComponent } from "./pdv/caja-observacion/add-caja-observacion-dialog/add-caja-observacion-dialog.component";
import { MainCajaObservacionComponent } from './pdv/caja-observacion/main-caja-observacion/main-caja-observacion.component';
import { CajaObservacionDashboardComponent } from './pdv/caja-observacion/caja-observacion-dashboard/caja-observacion-dashboard.component';
import { AnalisisDiferenciaComponent } from './analisis-diferencia/analisis-diferencia.component';
import { SearchMaletinGQL } from './maletin/graphql/searchMaletin';
import { FinancieroRoutingModule } from './financiero-routing.module';
import { ListTimbradoComponent } from "./timbrado/list-timbrado/list-timbrado.component";
import { AddTimbradoDialogComponent } from "./timbrado/add-timbrado-dialog/add-timbrado-dialog.component";
import { AddTimbradoDetalleDialogComponent } from "./timbrado/add-timbrado-detalle-dialog/add-timbrado-detalle-dialog.component";
import { BootstrapModule } from "../../commons/core/bootstrap.module";
import { ListLoteDeComponent } from './documento-electronico/lote-de/list-lote-de/list-lote-de.component';

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
    MostrarBalanceDialogComponent,
    ListFacturaLegalComponent,
    AddFacturaLegalDialogComponent,
    EditFacturaLegalDialogComponent,
    EditFacturaLegalItemComponent,
    AddVentaCreditoDialogComponent,
    ListVentaCreditoComponent,
    FinancieroConfiguracionDialogComponent,
    AddCajaCategoriaObsDialogComponent,
    AddCajaSubCategoriaObsDialogComponent,
    AddCajaMotivoObsDialogComponent,
    AddCajaObservacionComponent,
    MainCajaObservacionComponent,
    CajaObservacionDashboardComponent,
    AnalisisDiferenciaComponent,
    ListTimbradoComponent,
    AddTimbradoDialogComponent,
    AddTimbradoDetalleDialogComponent,
    ListLoteDeComponent

  ],
  providers: [
    SearchMaletinGQL
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    FinancieroRoutingModule,
    BootstrapModule
],
})
export class FinancieroModule {}
