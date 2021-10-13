import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Producto } from '../../../../productos/producto/producto.model';
import { ProductoCategoriaDialogComponent, ProductoCategoriaResponseData } from '../producto-categoria-dialog/producto-categoria-dialog.component';
import { SelectBilletesResponseData } from '../seleccionar-billetes-touch/seleccionar-billetes-touch.component';

export class SelectProductosData {
  productos: Producto[]
}

export class SelectProductosResponseData {
  producto: Producto;
  data: ProductoCategoriaResponseData
}

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
    console.log('abrio select producto')
    if(this.data.productos?.length > 0){
      this.productos = this.data.productos;
      console.log(this.productos)
      if(this.productos.length == 1){
        this.onProductoClick(this.productos[0])
      }
    }
  }

  onProductoClick(producto: Producto){
    this.matDialog.open(ProductoCategoriaDialogComponent, {
      data: {
        presentaciones: producto?.presentaciones
      },
    }).afterClosed().subscribe(res => {
      console.log(res)
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
