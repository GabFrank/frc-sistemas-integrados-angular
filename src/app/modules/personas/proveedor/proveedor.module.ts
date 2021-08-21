import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditProveedorComponent } from './edit-proveedor/edit-proveedor.component';
import { ListProveedorComponent } from './list-proveedor/list-proveedor.component';



@NgModule({
  declarations: [EditProveedorComponent, ListProveedorComponent],
  imports: [
    CommonModule
  ]
})
export class ProveedorModule { }
