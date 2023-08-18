import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from 'ngx-flexible-layout';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ProductoComponent } from './producto/edit-producto/producto.component';
import { ListProductoComponent } from './producto/list-producto/list-producto.component';
import { EditFamiliaComponent } from './familia/edit-familia/edit-familia.component';
import { ListFamiliaComponent } from './familia/list-familia/list-familia.component';
import { SearchProductoDialogComponent } from './producto/search-producto-dialog/search-producto-dialog.component';
import { PdvSearchProductoDialogComponent } from './producto/pdv-search-producto-dialog/pdv-search-producto-dialog.component';
import { CrearCodigosDialogComponent } from './codigo/crear-codigos-dialog/crear-codigos-dialog.component';
import { AddFamiliaDialogComponent } from './familia/add-familia-dialog/add-familia-dialog.component';
import { AddSubfamiliaDialogComponent } from './sub-familia/add-subfamilia-dialog/add-subfamilia-dialog.component';
import { PrecioPorSucursalComponent } from './precio-por-sucursal/precio-por-sucursal.component';
import { MaterialModule } from '../../commons/core/material.module';
import { SharedModule } from '../../shared/shared.module';
import { TipoPresentacionComponent } from './tipo-presentacion/tipo-presentacion.component';
import { PresentacionComponent } from './presentacion/presentacion.component';
import { AdicionarPresentacionComponent } from './presentacion/adicionar-presentacion/adicionar-presentacion.component';
import { AdicionarCodigoDialogComponent } from './codigo/adicionar-codigo-dialog/adicionar-codigo-dialog.component';
import { AdicionarPrecioDialogComponent } from './precio-por-sucursal/adicionar-precio-dialog/adicionar-precio-dialog.component';
import { SelectPrecioDialogComponent } from './precio-por-sucursal/select-precio-dialog/select-precio-dialog.component';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SeleccionarPresentacionDialogComponent } from './presentacion/seleccionar-presentacion-dialog/seleccionar-presentacion-dialog.component';
import { SearchEnvaseDialogComponent } from './envase/search-envase-dialog/search-envase-dialog.component';
import { AddEnvaseDialogComponent } from './envase/add-envase-dialog/add-envase-dialog.component';
import { ProductosDashboardComponent } from './productos-dashboard/productos-dashboard.component';
import { ListGrupoComponent } from './list-grupo/list-grupo.component';



@NgModule({
  declarations: [
    ListProductoComponent,
    ProductoComponent,
    EditFamiliaComponent,
    ListFamiliaComponent,
    SearchProductoDialogComponent,
    PdvSearchProductoDialogComponent,
    CrearCodigosDialogComponent,
    AddFamiliaDialogComponent,
    AddSubfamiliaDialogComponent,
    PrecioPorSucursalComponent,
    TipoPresentacionComponent,
    PresentacionComponent,
    AdicionarPresentacionComponent,
    AdicionarCodigoDialogComponent,
    AdicionarPrecioDialogComponent,
    SelectPrecioDialogComponent,
    SeleccionarPresentacionDialogComponent,
    SearchEnvaseDialogComponent,
    AddEnvaseDialogComponent,
    ProductosDashboardComponent,
    ListGrupoComponent,
  ],
  imports: [
    CommonModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SharedModule
  ],
  providers: [
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatDialogRef, useValue: {} }
]
})
export class ProductoModule { }
