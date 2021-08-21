import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RestaurantComponent } from './restaurant/restaurant.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { VentaTouchComponent } from './comercial/venta-touch/venta-touch.component';
import { ProductoCategoriaDialogComponent } from './comercial/venta-touch/producto-categoria-dialog/producto-categoria-dialog.component';
import { EditItemDialogComponent } from './comercial/venta-touch/edit-item-dialog/edit-item-dialog.component';
import { PagoTouchComponent } from './comercial/venta-touch/pago-touch/pago-touch.component';
import { NgxCurrencyModule } from 'ngx-currency';
import { VueltoDialogComponent } from './comercial/venta-touch/vuelto-dialog/vuelto-dialog.component';
import { SeleccionarBilletesTouchComponent } from './comercial/venta-touch/seleccionar-billetes-touch/seleccionar-billetes-touch.component';
import { DescuentoDialogComponent } from './comercial/venta-touch/descuento-dialog/descuento-dialog.component';
import { TarjetaDialogComponent } from './comercial/venta-touch/tarjeta-dialog/tarjeta-dialog.component';
import { DeliveryDialogComponent } from './comercial/venta-touch/delivery-dialog/delivery-dialog.component';
import { RedondeoDialogComponent } from './comercial/venta-touch/redondeo-dialog/redondeo-dialog.component';



@NgModule({
  declarations: [RestaurantComponent, VentaTouchComponent, ProductoCategoriaDialogComponent, EditItemDialogComponent, PagoTouchComponent, VueltoDialogComponent, SeleccionarBilletesTouchComponent, DescuentoDialogComponent, TarjetaDialogComponent, DeliveryDialogComponent, RedondeoDialogComponent],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    
  ]
})
export class PdvModule { }
