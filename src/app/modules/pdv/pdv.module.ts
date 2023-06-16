import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FlexLayoutModule } from "ngx-flexible-layout";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BootstrapModule } from "../../commons/core/bootstrap.module";
import { MaterialModule } from "../../commons/core/material.module";
import { SharedModule } from "../../shared/shared.module";
import { AdicionarPdvProductoDialogComponent } from "./comercial/venta-touch/adicionar-pdv-producto-dialog/adicionar-pdv-producto-dialog.component";
import { DeliveryDialogComponent } from "./comercial/venta-touch/delivery-dialog/delivery-dialog.component";
import { DeliveryPresupuestoDialogComponent } from './comercial/venta-touch/delivery-presupuesto-dialog/delivery-presupuesto-dialog.component';
import { EditItemDialogComponent } from "./comercial/venta-touch/edit-item-dialog/edit-item-dialog.component";
import { DeliveryOpcionesDialogComponent } from './comercial/venta-touch/list-delivery/delivery-opciones-dialog/delivery-opciones-dialog.component';
import { EditDeliveryDialogComponent } from './comercial/venta-touch/list-delivery/edit-delivery-dialog/edit-delivery-dialog.component';
import { ListDeliveryComponent } from './comercial/venta-touch/list-delivery/list-delivery.component';
import { DescuentoDialogComponent } from "./comercial/venta-touch/pago-touch/descuento-dialog/descuento-dialog.component";
import { PagoTouchComponent } from "./comercial/venta-touch/pago-touch/pago-touch.component";
import { AddCategoriaDialogComponent } from "./comercial/venta-touch/pdv-categoria/add-categoria-dialog/add-categoria-dialog.component";
import { ProductoCategoriaDialogComponent } from "./comercial/venta-touch/producto-categoria-dialog/producto-categoria-dialog.component";
import { RedondeoDialogComponent } from "./comercial/venta-touch/redondeo-dialog/redondeo-dialog.component";
import { SeleccionarBilletesTouchComponent } from "./comercial/venta-touch/seleccionar-billetes-touch/seleccionar-billetes-touch.component";
import { SeleccionarCajaDialogComponent } from "./comercial/venta-touch/seleccionar-caja-dialog/seleccionar-caja-dialog.component";
import { SeleccionarEnvaseDialogComponent } from './comercial/venta-touch/seleccionar-envase-dialog/seleccionar-envase-dialog.component';
import { SelectProductosDialogComponent } from "./comercial/venta-touch/select-productos-dialog/select-productos-dialog.component";
import { TarjetaDialogComponent } from "./comercial/venta-touch/tarjeta-dialog/tarjeta-dialog.component";
import { UltimasCajasDialogComponent } from './comercial/venta-touch/ultimas-cajas-dialog/ultimas-cajas-dialog.component';
import { UtilitariosDialogComponent } from "./comercial/venta-touch/utilitarios-dialog/utilitarios-dialog.component";
import { VentaTouchComponent } from "./comercial/venta-touch/venta-touch.component";
import { VueltoDialogComponent } from "./comercial/venta-touch/vuelto-dialog/vuelto-dialog.component";
import { BuscadorComponent } from './layout/buscador/buscador.component';
import { FavoritosComponent } from './layout/favoritos/favoritos.component';
import { ItemListComponent } from './layout/item-list/item-list.component';
import { TotalesComponent } from './layout/totales/totales.component';
import { RestaurantComponent } from "./restaurant/restaurant.component";
import { GarantiaDevolucionDialogComponent } from './venta-touch/garantia-devolucion-dialog/garantia-devolucion-dialog.component';
import { DevolucionDialogComponent } from './venta-touch/garantia-devolucion/devolucion-dialog/devolucion-dialog.component';
import { EditCantidadEnvasesDialogComponent } from './venta-touch/garantia-devolucion/garantia-dialog/edit-cantidad-envases-dialog/edit-cantidad-envases-dialog.component';
import { GarantiaDialogComponent } from './venta-touch/garantia-devolucion/garantia-dialog/garantia-dialog.component';
import { Ng2FittextModule } from "ng2-fittext";
import { DynamicFontSizeDirective } from "../../shared/directives/dynamic-font-size.directive";

@NgModule({
  declarations: [
    RestaurantComponent,
    VentaTouchComponent,
    ProductoCategoriaDialogComponent,
    EditItemDialogComponent,
    PagoTouchComponent,
    VueltoDialogComponent,
    SeleccionarBilletesTouchComponent,
    DescuentoDialogComponent,
    TarjetaDialogComponent,
    DeliveryDialogComponent,
    RedondeoDialogComponent,
    SelectProductosDialogComponent,
    AddCategoriaDialogComponent,
    AdicionarPdvProductoDialogComponent,
    SeleccionarCajaDialogComponent,
    UtilitariosDialogComponent,
    SeleccionarEnvaseDialogComponent,
    GarantiaDevolucionDialogComponent,
    GarantiaDialogComponent,
    DevolucionDialogComponent,
    ItemListComponent,
    TotalesComponent,
    FavoritosComponent,
    BuscadorComponent,
    EditCantidadEnvasesDialogComponent,
    UltimasCajasDialogComponent,
    DescuentoDialogComponent,
    DeliveryPresupuestoDialogComponent,
    ListDeliveryComponent,
    DeliveryOpcionesDialogComponent,
    EditDeliveryDialogComponent,
    DynamicFontSizeDirective
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule,
    BootstrapModule,
    Ng2FittextModule
  ],
})
export class PdvModule {}
