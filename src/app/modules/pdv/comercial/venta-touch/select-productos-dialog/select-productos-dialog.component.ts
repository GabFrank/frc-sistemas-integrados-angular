import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Producto } from '../../../../productos/producto/producto.model';
import { ProductoCategoriaDialogComponent, ProductoCategoriaResponseData } from '../producto-categoria-dialog/producto-categoria-dialog.component';
import { SelectBilletesResponseData } from '../seleccionar-billetes-touch/seleccionar-billetes-touch.component';

export class SelectProductosData {
  descripcion: string;
  productos: Producto[]
}

export class SelectProductosResponseData {
  producto: Producto;
  data: ProductoCategoriaResponseData
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-select-productos-dialog',
  templateUrl: './select-productos-dialog.component.html',
  styleUrls: ['./select-productos-dialog.component.scss']
})
export class SelectProductosDialogComponent implements OnInit {

  productos: Producto[] = []

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SelectProductosData,
    public dialogRef: MatDialogRef<SelectProductosDialogComponent>,
    public matDialog: MatDialog
  ) { }

  ngOnInit(): void {
    if(this.data.productos?.length > 0){
      this.productos = this.data.productos;
      if(this.productos.length == 1){
        this.onProductoClick(this.productos[0])
      }
    }
  }

  onProductoClick(producto: Producto){
    this.matDialog.open(ProductoCategoriaDialogComponent, {
      data: {
        presentaciones: producto?.presentaciones,
        producto
      },
      width: '90%'
    }).afterClosed().pipe(untilDestroyed(this)).subscribe(res => {
      let respuesta: SelectProductosResponseData = new SelectProductosResponseData;
      let productoCategoriaResponse : ProductoCategoriaResponseData = res;
      if(productoCategoriaResponse?.presentacion!=null && productoCategoriaResponse.precio!=null){
        respuesta.producto = producto;
        respuesta.data = productoCategoriaResponse;
        this.dialogRef.close(respuesta)
      } else {
        this.dialogRef.close()
      }
    })
  }

}
