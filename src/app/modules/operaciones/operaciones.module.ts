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
import { PedidoItensDialogComponent } from './pedido/pedido-itens/pedido-itens-dialog/pedido-itens-dialog.component';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { IConfig, NgxMaskModule } from 'ngx-mask';
import { ListMovimientoStockComponent } from './movimiento-stock/list-movimiento-stock/list-movimiento-stock.component';
import { EntradaSalidaComponent } from './entrada-salida/entrada-salida.component';
import { EntradaDialogComponent } from './entrada/entrada-dialog/entrada-dialog.component';
import { SalidaDialogComponent } from './salida/salida-dialog/salida-dialog.component';
import { AdicionarItemDialogComponent } from './pedido/adicionar-item-dialog/adicionar-item-dialog.component';

export const options: Partial<IConfig> | (() => Partial<IConfig>) = null;

@NgModule({
  declarations: [
    ListPedidoComponent,
    EditPedidoComponent,
    ListCompraComponent,
    EditCompraComponent,
    ListNecesidadComponent,
    EditNecesidadComponent,
    PedidoItensDialogComponent,
    ListMovimientoStockComponent,
    EntradaSalidaComponent,
    EntradaDialogComponent,
    SalidaDialogComponent,
    AdicionarItemDialogComponent,
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    NgxMaskModule.forRoot(),

  ],
  providers:[
    { provide: LOCALE_ID, useValue: 'es-PY' } ,
  ]
})
export class OperacionesModule { }
