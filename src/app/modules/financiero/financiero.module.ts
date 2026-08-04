import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BancoComponent } from "./banco/banco.component";
import { CambioComponent } from "./cambio/cambio.component";
import { CuentaBancariaComponent } from "./cuenta-bancaria/cuenta-bancaria.component";
import { FinancieroDashboardComponent } from "./financiero-dashboard/financiero-dashboard.component";
import { FormaPagoComponent } from "./forma-pago/forma-pago.component";
import { MaletinComponent } from "./maletin/maletin.component";
import { MonedaComponent } from "./moneda/moneda.component";
import { AddMonedaDialogComponent } from "./moneda/add-moneda-dialog/add-moneda-dialog.component";
import { ListCajaComponent } from "./pdv/caja/list-caja/list-caja.component";
import { FlexLayoutModule } from "ngx-flexible-layout";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MaterialModule } from "../../commons/core/material.module";
import { SharedModule } from "../../shared/shared.module";
import { ListMaletinComponent } from './maletin/list-maletin/list-maletin.component';
import { AdicionarMaletinDialogComponent } from './maletin/adicionar-maletin-dialog/adicionar-maletin-dialog.component';
import { AdicionarCajaDialogComponent } from './pdv/caja/adicionar-caja-dialog/adicionar-caja-dialog.component';
import { SinMaletinDialogComponent } from './pdv/sin-maletin-dialog/sin-maletin-dialog.component';
import { AdicionarConteoDialogComponent } from './conteo/adicionar-conteo-dialog/adicionar-conteo-dialog.component';
import { AdicionarRetiroDialogComponent } from './retiro/adicionar-retiro-dialog/adicionar-retiro-dialog.component';
import { ListRetiroComponent } from './retiro/list-retiro/list-retiro.component';
import { CrearCambioDialogComponent } from './cambio/crear-cambio-dialog/crear-cambio-dialog.component';
import { MostrarBalanceDialogComponent } from './pdv/caja/mostrar-balance-dialog/mostrar-balance-dialog.component';
import { ListFacturaLegalComponent } from './factura-legal/list-factura-legal/list-factura-legal.component';
import { AddFacturaLegalDialogComponent } from './factura-legal/add-factura-legal-dialog/add-factura-legal-dialog.component';
import { EditFacturaLegalDialogComponent } from './factura-legal/edit-factura-legal-dialog/edit-factura-legal-dialog.component';
import { EditFacturaLegalItemComponent } from './factura-legal/edit-factura-legal-item/edit-factura-legal-item.component';
import { ImprimirEnSucursalDialogComponent } from './factura-legal/imprimir-en-sucursal-dialog/imprimir-en-sucursal-dialog.component';
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
import { GestionDeDialogComponent } from './factura-legal/gestion-de-dialog/gestion-de-dialog.component';
import { InutilizacionNumerosTabComponent } from './factura-legal/inutilizacion-numeros-tab/inutilizacion-numeros-tab.component';
import { TransferirCajaDialogComponent } from "./pdv/caja/transferir-caja-dialog/transferir-caja-dialog.component";
import { ListTerminalPosComponent } from "./terminal-pos/list-terminal-pos/list-terminal-pos.component";
import { AddTerminalPosDialogComponent } from "./terminal-pos/add-terminal-pos-dialog/add-terminal-pos-dialog.component";
import { PrintTerminalPosDialogComponent } from "./terminal-pos/print-terminal-pos-dialog/print-terminal-pos-dialog.component";
import { ScanTerminalPosDialogComponent } from "./terminal-pos/scan-terminal-pos-dialog/scan-terminal-pos-dialog.component";
import { TerminalPosDashboard } from "./terminal-pos/terminal-pos-dashboard/terminal-pos-dashboard.component";
import { ListVentaTarjetaComponent } from "./venta-tarjeta/list-venta-tarjeta/list-venta-tarjeta.component";
import { ConfiguracionVentaTarjetaDialogComponent } from "./venta-tarjeta/configuracion-venta-tarjeta-dialog/configuracion-venta-tarjeta-dialog.component";
import { NgxExtendedPdfViewerModule } from "ngx-extended-pdf-viewer";
import { ConfiguracionFacturaConVentaDialogComponent } from "./factura-legal/configuracion-factura-con-venta-dialog/configuracion-factura-con-venta-dialog.component";
import { FacturaLegalDashboard } from "./factura-legal/factura-legal-dashboard/factura-legal-dashboard.component";
import { AddCajaVirtualDialogComponent } from './caja-virtual/add-caja-virtual-dialog/add-caja-virtual-dialog.component';
import { AddMovimientoCajaVirtualDialogComponent } from './caja-virtual/add-movimiento-caja-virtual-dialog/add-movimiento-caja-virtual-dialog.component';
import { TransferenciaCajaVirtualDialogComponent } from './caja-virtual/transferencia-caja-virtual-dialog/transferencia-caja-virtual-dialog.component';
import { CajaVirtualDashboardComponent } from './caja-virtual/caja-virtual-dashboard/caja-virtual-dashboard.component';
import { ConfigurarCajaVirtualDialogComponent } from './caja-virtual/configurar-caja-virtual-dialog/configurar-caja-virtual-dialog.component';
import { RegistrarIngresoDialogComponent } from './caja-virtual/registrar-ingreso-dialog/registrar-ingreso-dialog.component';
import { MaletinTesoreriaDialogComponent } from './maletin/maletin-tesoreria-dialog/maletin-tesoreria-dialog.component';
import { RegistrarEgresoDialogComponent } from './caja-virtual/registrar-egreso-dialog/registrar-egreso-dialog.component';
import { ListCajaVirtualComponent } from './caja-virtual/list-caja-virtual/list-caja-virtual.component';
import { HistorialMovimientosCajaVirtualComponent } from './caja-virtual/historial-movimientos-caja-virtual/historial-movimientos-caja-virtual.component';
import { AddEntradaVariaDialogComponent } from './entrada-varia/add-entrada-varia-dialog/add-entrada-varia-dialog.component';
import { ListEntradasVariasDialogComponent } from './entrada-varia/list-entradas-varias-dialog/list-entradas-varias-dialog.component';
import { AddOperacionFinancieraDialogComponent } from './operacion-financiera/add-operacion-financiera-dialog/add-operacion-financiera-dialog.component';
import { ListOperacionFinancieraComponent } from './operacion-financiera/list-operacion-financiera/list-operacion-financiera.component';
import { ListMovimientosBancariosDialogComponent } from './operacion-financiera/list-movimientos-bancarios-dialog/list-movimientos-bancarios-dialog.component';
import { AddBancoDialogComponent } from './banco/add-banco-dialog/add-banco-dialog.component';
import { AddCuentaBancariaDialogComponent } from './cuenta-bancaria/add-cuenta-bancaria-dialog/add-cuenta-bancaria-dialog.component';

@NgModule({
  declarations: [
    BancoComponent,
    CambioComponent,
    CuentaBancariaComponent,
    FinancieroDashboardComponent,
    FormaPagoComponent,
    MaletinComponent,
    MonedaComponent,
    AddMonedaDialogComponent,
    ListCajaComponent,
    ListMaletinComponent,
    AdicionarMaletinDialogComponent,
    AdicionarCajaDialogComponent,
    SinMaletinDialogComponent,
    AdicionarConteoDialogComponent,
    AdicionarRetiroDialogComponent,
    ListRetiroComponent,
    CrearCambioDialogComponent,
    MostrarBalanceDialogComponent,
    ListFacturaLegalComponent,
    AddFacturaLegalDialogComponent,
    EditFacturaLegalDialogComponent,
    EditFacturaLegalItemComponent,
    ImprimirEnSucursalDialogComponent,
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
    ListLoteDeComponent,
    GestionDeDialogComponent,
    InutilizacionNumerosTabComponent,
    TransferirCajaDialogComponent,
    ListTerminalPosComponent,
    AddTerminalPosDialogComponent,
    PrintTerminalPosDialogComponent,
    ScanTerminalPosDialogComponent,
    TerminalPosDashboard,
    ListVentaTarjetaComponent,
    ConfiguracionVentaTarjetaDialogComponent,
    ConfiguracionFacturaConVentaDialogComponent,
    FacturaLegalDashboard,
    AddCajaVirtualDialogComponent,
    AddMovimientoCajaVirtualDialogComponent,
    TransferenciaCajaVirtualDialogComponent,
    CajaVirtualDashboardComponent,
    ConfigurarCajaVirtualDialogComponent,
    RegistrarIngresoDialogComponent,
    MaletinTesoreriaDialogComponent,
    RegistrarEgresoDialogComponent,
    ListCajaVirtualComponent,
    HistorialMovimientosCajaVirtualComponent,
    AddEntradaVariaDialogComponent,
    ListEntradasVariasDialogComponent,
    AddOperacionFinancieraDialogComponent,
    ListOperacionFinancieraComponent,
    ListMovimientosBancariosDialogComponent,
    AddBancoDialogComponent,
    AddCuentaBancariaDialogComponent

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
    BootstrapModule,
    NgxExtendedPdfViewerModule
  ],
})
export class FinancieroModule { }
