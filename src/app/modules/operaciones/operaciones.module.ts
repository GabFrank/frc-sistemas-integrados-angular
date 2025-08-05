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
import { ListMovimientoStockComponent } from './movimiento-stock/list-movimiento-stock/list-movimiento-stock.component';
import { EditNecesidadComponent } from './necesidad/edit-necesidad/edit-necesidad.component';
import { ListNecesidadComponent } from './necesidad/list-necesidad/list-necesidad.component';

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
import { AddCategoriaObsDialogComponent } from './categoria-observacion/add-categoria-obs-dialog/add-categoria-obs-dialog.component';
import { VentaObservacionDashboardComponent } from './venta-observacion/venta-observacion-dashboard/venta-observacion-dashboard.component';
import { AddSubcategoriaObsDialogComponent } from './sub-categoria-observacion/add-subcategoria-obs-dialog/add-subcategoria-obs-dialog.component';
import { AddVentaObservacionComponent } from './venta-observacion/add-venta-observacion/add-venta-observacion.component';
import { AddMotivoObsDialogComponent } from './motivo-observacion/add-motivo-obs-dialog/add-motivo-obs-dialog.component';
import { MainVentaObservacionComponent } from './venta-observacion/main-venta-observacion/main-venta-observacion.component';
import { ListPagoComponent } from './pago/list-pago/list-pago.component';
import { PagoDetalleDialogComponent } from './pago/edit-pago/pago-detalle-dialog/pago-detalle-dialog.component';
import { ModificarSucursalPagoDetalleComponent } from './pago/pago-detalle-cuota/modificar-sucursal-pago-detalle/modificar-sucursal-pago-detalle.component';


import { GestionComprasComponent } from './compra/gestion-compras/gestion-compras.component';
import { AddEditItemDialogComponent } from './compra/gestion-compras/dialogs/add-edit-item-dialog/add-edit-item-dialog.component';
import { DistributeItemDialogComponent } from './compra/gestion-compras/dialogs/distribute-item-dialog/distribute-item-dialog.component';
import { AddEditNotaRecepcionDialogComponent } from './compra/gestion-compras/dialogs/add-edit-nota-recepcion-dialog/add-edit-nota-recepcion-dialog.component';
import { EditNotaRecepcionItemDialogComponent } from './compra/gestion-compras/dialogs/edit-nota-recepcion-item-dialog/edit-nota-recepcion-item-dialog.component';
import { DistributeNotaRecepcionItemDialogComponent } from './compra/gestion-compras/dialogs/distribute-nota-recepcion-item-dialog/distribute-nota-recepcion-item-dialog.component';
import { DividirItemDialogComponent } from './compra/gestion-compras/dialogs/dividir-item-dialog/dividir-item-dialog.component';
import { RechazarItemDialogComponent } from './compra/gestion-compras/dialogs/rechazar-item-dialog/rechazar-item-dialog.component';
import { RecepcionMercaderiaComponent } from './compra/gestion-compras/recepcion-mercaderia/recepcion-mercaderia.component';
import { RecepcionMercaderiaVerificarItemDialogComponent } from './compra/gestion-compras/recepcion-mercaderia/recepcion-mercaderia-verificar-item-dialog/recepcion-mercaderia-verificar-item-dialog.component';
import { RecepcionMercaderiaRechazarItemDialogComponent } from './compra/gestion-compras/recepcion-mercaderia/recepcion-mercaderia-rechazar-item-dialog/recepcion-mercaderia-rechazar-item-dialog.component';
import { VerificacionRapidaSucursalesDialogComponent } from './compra/gestion-compras/recepcion-mercaderia/verificacion-rapida-sucursales-dialog/verificacion-rapida-sucursales-dialog.component';

@NgModule({
  declarations: [
    ListCompraComponent,
    EditCompraComponent,
    ListNecesidadComponent,
    EditNecesidadComponent,
    ListMovimientoStockComponent,
    EntradaSalidaComponent,
    EntradaDialogComponent,
    SalidaDialogComponent,
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
    PrecioDeliveryComponent,
    DeliveryDashboardComponent,
    LucroPorProductoComponent,
    CompraDashboardComponent,
    AddCategoriaObsDialogComponent,
    VentaObservacionDashboardComponent,
    AddSubcategoriaObsDialogComponent,
    AddVentaObservacionComponent,
    AddMotivoObsDialogComponent,
    MainVentaObservacionComponent,
    ListPagoComponent,
    PagoDetalleDialogComponent,
    ModificarSucursalPagoDetalleComponent,
    GestionComprasComponent,
    AddEditItemDialogComponent,
    DistributeItemDialogComponent,
    AddEditNotaRecepcionDialogComponent,
    EditNotaRecepcionItemDialogComponent,
    DistributeNotaRecepcionItemDialogComponent,
    DividirItemDialogComponent,
    RechazarItemDialogComponent,
    RecepcionMercaderiaComponent,
    RecepcionMercaderiaVerificarItemDialogComponent,
    RecepcionMercaderiaRechazarItemDialogComponent,
    VerificacionRapidaSucursalesDialogComponent,
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
  ],
  exports: [
  ],
  providers:[
    { provide: LOCALE_ID, useValue: 'es-PY' } ,
  ]
})
export class OperacionesModule { }
