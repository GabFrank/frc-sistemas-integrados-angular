import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Presentacion } from '../../presentacion/presentacion.model';
import { Producto } from '../../producto/producto.model';
import { PrecioPorSucursal } from '../precio-por-sucursal.model';

export class SelectPrecioData {
  producto: Producto;
  presentacion: Presentacion;
}
export class SelectPrecioResponse {
  precio: PrecioPorSucursal;
}

@Component({
  selector: 'app-select-precio-dialog',
  templateUrl: './select-precio-dialog.component.html',
  styleUrls: ['./select-precio-dialog.component.scss']
})
export class SelectPrecioDialogComponent implements OnInit {

  selectedPrecio: PrecioPorSucursal;
  selectedPrecioRowIndex = -1;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SelectPrecioData,
    private matDialogRef: MatDialogRef<SelectPrecioDialogComponent>,
  ) { }

  ngOnInit(): void {
  }

  onPrecioClick(precio){
    if(precio!=null){
      this.matDialogRef.close(precio)
    }
  }

  highlight(index){
    if (index >= 0 && index <= this.data.presentacion.precios.length - 1) {
      this.selectedPrecioRowIndex = index;
      this.selectedPrecio = this.data.presentacion.precios[index];
    }
  }

  keyBoardEvent(key, index){
    switch (key) {
      case 'ArrowRigth':
        this.highlight(index++)
        break;
      case 'ArrowLeft':
        this.highlight(index--)
        break;
    
      default:
        break;
    }
  }

}
