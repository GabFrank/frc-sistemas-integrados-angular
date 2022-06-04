import { InventarioModule } from './inventario/inventario.module';
import { LOCALE_ID, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { EditPedidoComponent } from './pedido/edit-pedido/edit-pedido.component';
import { ListCompraComponent } from './compra/list-compra/list-compra.component';
import { EditCompraComponent } from './compra/edit-compra/edit-compra.component';
import { ListPedidoComponent } from './pedido/list-pedido/list-pedido.component';
import { ListNecesidadComponent } from './necesidad/list-necesidad/list-necesidad.component';
import { EditNecesidadComponent } from './necesidad/edit-necesidad/edit-necesidad.component';
import { IConfig, NgxMaskModule } from 'ngx-mask';
import { ListMovimientoStockComponent } from './movimiento-stock/list-movimiento-stock/list-movimiento-stock.component';
import { EntradaSalidaComponent } from './entrada-salida/entrada-salida.component';
import { EntradaDialogComponent } from './entrada/entrada-dialog/entrada-dialog.component';
import { SalidaDialogComponent } from './salida/salida-dialog/salida-dialog.component';
import { AdicionarItemDialogComponent } from './pedido/adicionar-item-dialog/adicionar-item-dialog.component';
import { AdicionarNotaRecepcionDialogComponent } from './pedido/nota-recepcion/adicionar-nota-recepcion-dialog/adicionar-nota-recepcion-dialog.component';
import { AdicionarNotaRecepcionItemDialogComponent } from './pedido/nota-recepcion/adicionar-nota-recepcion-item-dialog/adicionar-nota-recepcion-item-dialog.component';
import { SeleccionarNotaRecepcionDialogComponent } from './pedido/nota-recepcion/seleccionar-nota-recepcion-dialog/seleccionar-nota-recepcion-dialog.component';
import { AdicionarDetalleCompraItemDialogComponent } from './compra/adicionar-detalle-compra-item-dialog/adicionar-detalle-compra-item-dialog.component';
import { AdicionarProgramarPrecioDialogComponent } from './precio/programar-precio/adicionar-programar-precio-dialog/adicionar-programar-precio-dialog.component';
import { UltimasVentasDialogComponent } from './venta/ultimas-ventas-dialog/ultimas-ventas-dialog.component';
import { ListVentaComponent } from './venta/list-venta/list-venta.component';
import { VentaPorPeriodoComponent } from './venta/reportes/venta-por-periodo/venta-por-periodo.component';
import { TransferenciaComponent } from './transferencia/transferencia.component';
import { ListTransferenciaComponent } from './transferencia/list-transferencia/list-transferencia.component';
import { EditTransferenciaComponent } from './transferencia/edit-transferencia/edit-transferencia.component';
import { SeleccionarSucursalDialogComponent } from './transferencia/seleccionar-sucursal-dialog/seleccionar-sucursal-dialog.component';
import { CreateItemDialogComponent } from './transferencia/create-item-dialog/create-item-dialog.component';
import { ModificarItemDialogComponent } from './transferencia/modificar-item-dialog/modificar-item-dialog.component';
import { TransferenciaTimelineDialogComponent } from '../transferencias/transferencia-timeline-dialog/transferencia-timeline-dialog.component';

export const options: Partial<IConfig> | (() => Partial<IConfig>) = null;

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
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    InventarioModule,
    NgxMaskModule.forRoot(),
    
  ],
  providers:[
    { provide: LOCALE_ID, useValue: 'es-PY' } ,
  ]
})
export class OperacionesModule { }
