import { CommonModule } from '@angular/common';
import { LOCALE_ID, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { EmpresarialModule } from '../empresarial/empresarial.module';
import { TransferenciaTimelineDialogComponent } from '../transferencias/transferencia-timeline-dialog/transferencia-timeline-dialog.component';
import { AdicionarDetalleCompraItemDialogComponent } from './compra/adicionar-detalle-compra-item-dialog/adicionar-detalle-compra-item-dialog.component';
import { EditCompraComponent } from './compra/edit-compra/edit-compra.component';
import { ListCompraComponent } from './compra/list-compra/list-compra.component';
import { DeliveryDashboardComponent } from './delivery/delivery-dashboard/delivery-dashboard.component';
import { PrecioDeliveryComponent } from './delivery/precio-delivery/precio-delivery.component';
import { EntradaSalidaComponent } from './entrada-salida/entrada-salida.component';
import { EntradaDialogComponent } from './entrada/entrada-dialog/entrada-dialog.component';
import { InventarioModule } from './inventario/inventario.module';
import { ModificacionesModuleModule } from './modificaciones-sistema/modificaciones.module';
import { ListMovimientoStockComponent } from './movimiento-stock/list-movimiento-stock/list-movimiento-stock.component';
import { EditNecesidadComponent } from './necesidad/edit-necesidad/edit-necesidad.component';
import { ListNecesidadComponent } from './necesidad/list-necesidad/list-necesidad.component';
import { AdicionarItemDialogComponent } from './pedido/adicionar-item-dialog/adicionar-item-dialog.component';
import { EditPedidoComponent } from './pedido/edit-pedido/edit-pedido.component';
import { ListPedidoComponent } from './pedido/list-pedido/list-pedido.component';
import { AdicionarNotaRecepcionDialogComponent } from './pedido/nota-recepcion/adicionar-nota-recepcion-dialog/adicionar-nota-recepcion-dialog.component';
import { AdicionarNotaRecepcionItemDialogComponent } from './pedido/nota-recepcion/adicionar-nota-recepcion-item-dialog/adicionar-nota-recepcion-item-dialog.component';
import { SeleccionarNotaRecepcionDialogComponent } from './pedido/nota-recepcion/seleccionar-nota-recepcion-dialog/seleccionar-nota-recepcion-dialog.component';
import { PedidoDashboardComponent } from './pedido/pedido-dashboard/pedido-dashboard.component';
import { AdicionarProgramarPrecioDialogComponent } from './precio/programar-precio/adicionar-programar-precio-dialog/adicionar-programar-precio-dialog.component';
import { SalidaDialogComponent } from './salida/salida-dialog/salida-dialog.component';
import { CreateItemDialogComponent } from './transferencia/create-item-dialog/create-item-dialog.component';
import { EditTransferenciaComponent } from './transferencia/edit-transferencia/edit-transferencia.component';
import { ListTransferenciaComponent } from './transferencia/list-transferencia/list-transferencia.component';
import { ModificarItemDialogComponent } from './transferencia/modificar-item-dialog/modificar-item-dialog.component';
import { SeleccionarSucursalDialogComponent } from './transferencia/seleccionar-sucursal-dialog/seleccionar-sucursal-dialog.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';
import { ListVentaComponent } from './venta/list-venta/list-venta.component';
import { LucroPorProductoComponent } from './venta/reportes/lucro-por-producto/lucro-por-producto.component';
import { VentaPorPeriodoComponent } from './venta/reportes/venta-por-periodo/venta-por-periodo.component';
import { UltimasVentasDialogComponent } from './venta/ultimas-ventas-dialog/ultimas-ventas-dialog.component';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { CompraDashboardComponent } from './compra/compra-dashboard/compra-dashboard.component';
import { DividirItemDialogComponent } from './pedido/dividir-item-dialog/dividir-item-dialog.component';
import { EditarPedidpItemDialogComponent } from './pedido/editar-pedidp-item-dialog/editar-pedidp-item-dialog.component';
import { PagoPedidoDialogComponent } from './pedido/pago-pedido-dialog/pago-pedido-dialog.component';
import { AddCategoriaObsDialogComponent } from './categoria-observacion/add-categoria-obs-dialog/add-categoria-obs-dialog.component';
import { VentaObservacionDashboardComponent } from './venta-observacion/venta-observacion-dashboard/venta-observacion-dashboard.component';
import { AddSubcategoriaObsDialogComponent } from './sub-categoria-observacion/add-subcategoria-obs-dialog/add-subcategoria-obs-dialog.component';
import { AddVentaObservacionComponent } from './venta-observacion/add-venta-observacion/add-venta-observacion.component';
import { AddMotivoObsDialogComponent } from './motivo-observacion/add-motivo-obs-dialog/add-motivo-obs-dialog.component';
import { MainVentaObservacionComponent } from './venta-observacion/main-venta-observacion/main-venta-observacion.component';
import { PedidoItemSucursalDialogComponent } from './pedido/pedido-item-sucursal/pedido-item-sucursal-dialog/pedido-item-sucursal-dialog.component';
import { ListSolicitudPagoComponent } from './solicitud-pago/list-solicitud-pago/list-solicitud-pago.component';
import { ListPagoComponent } from './pago/list-pago/list-pago.component';
import { EditPagoComponent } from './pago/edit-pago/edit-pago.component';
import { PagoDetalleDialogComponent } from './pago/edit-pago/pago-detalle-dialog/pago-detalle-dialog.component';
import { ModificarSucursalPagoDetalleComponent } from './pago/pago-detalle-cuota/modificar-sucursal-pago-detalle/modificar-sucursal-pago-detalle.component';
import { AcompanhanteComponent } from './transferencia/acompanhante/acompanhante.component';
import { RutaHojaComponent } from './transferencia/ruta-hoja/ruta-hoja.component';
import { EntregadoresComponent } from './transferencia/entregadores/entregadores.component';

@NgModule({
  declarations: [
    ListPedidoComponent,
    EditPedidoComponent,
    ListCompraComponent,
    EditCompraComponent,
    ListNecesidadComponent,
    EditNecesidadComponent,
    ListMovimientoStockComponent,
    EntradaSalidaComponent,
    EntradaDialogComponent,
    SalidaDialogComponent,
    AdicionarItemDialogComponent,
    AdicionarNotaRecepcionDialogComponent,
    AdicionarNotaRecepcionItemDialogComponent,
    SeleccionarNotaRecepcionDialogComponent,
    AdicionarDetalleCompraItemDialogComponent,
    AdicionarProgramarPrecioDialogComponent,
    UltimasVentasDialogComponent,
    ListVentaComponent,
    VentaPorPeriodoComponent,
    TransferenciaComponent,
    ListTransferenciaComponent,
    EditTransferenciaComponent,
    SeleccionarSucursalDialogComponent,
    CreateItemDialogComponent,
    ModificarItemDialogComponent,
    TransferenciaTimelineDialogComponent,
    PedidoDashboardComponent,
    PrecioDeliveryComponent,
    DeliveryDashboardComponent,
    LucroPorProductoComponent,
    CompraDashboardComponent,
    DividirItemDialogComponent,
    EditarPedidpItemDialogComponent,
    PagoPedidoDialogComponent,
    AddCategoriaObsDialogComponent,
    VentaObservacionDashboardComponent,
    AddSubcategoriaObsDialogComponent,
    AddVentaObservacionComponent,
    AddMotivoObsDialogComponent,
    MainVentaObservacionComponent,
    PedidoItemSucursalDialogComponent,
    ListSolicitudPagoComponent,
    ListPagoComponent,
    EditPagoComponent,
    PagoDetalleDialogComponent,
    ModificarSucursalPagoDetalleComponent,
    AcompanhanteComponent,
    RutaHojaComponent,
    EntregadoresComponent
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    InventarioModule,
    EmpresarialModule,
    ModificacionesModuleModule,
    
  ],
  exports: [
    EditPedidoComponent
  ],
  providers:[
    { provide: LOCALE_ID, useValue: 'es-PY' } ,
  ]
})
export class OperacionesModule { }
