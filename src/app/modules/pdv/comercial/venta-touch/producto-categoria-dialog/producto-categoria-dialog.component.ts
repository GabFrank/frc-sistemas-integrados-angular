import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CurrencyMask } from '../../../../../commons/core/utils/numbersUtils';
import { MainService } from '../../../../../main.service';
import { Producto } from '../../../../../modules/productos/producto/producto.model';
import { TipoPrecio } from '../../../../../modules/productos/tipo-precio/tipo-precio.model';
import { TecladoNumericoComponent } from '../../../../../shared/components/teclado-numerico/teclado-numerico.component';
import { WindowInfoService } from '../../../../../shared/services/window-info.service';
import { PdvGruposProductos } from '../pdv-grupos-productos/pdv-grupos-productos.model';

export class ProductoCategoriaDialogData {
  productos: PdvGruposProductos[]
  cantidad?: number;
  texto?;
  tipoPrecio?: TipoPrecio;
  tiposPrecios: TipoPrecio[];
}

export class ProductoCategoriaResponseData {
  producto: Producto;
  cantidad: number;
  tipoPrecio: TipoPrecio;
}

@Component({
  selector: 'app-producto-categoria-dialog',
  templateUrl: './producto-categoria-dialog.component.html',
  styleUrls: ['./producto-categoria-dialog.component.css']
})
export class ProductoCategoriaDialogComponent implements OnInit {

  @ViewChild('cantidad', {static: false}) cantidadInput: ElementRef;

  productos : PdvGruposProductos[] = []
  tipoPrecio: TipoPrecio;
  tiposPrecios : TipoPrecio[];
  cantidad = 1;
  formGroup : FormGroup;
  currency = new CurrencyMask;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ProductoCategoriaDialogData,
              public dialogRef: MatDialogRef<ProductoCategoriaDialogComponent>,
              public windowInfo : WindowInfoService,
              public matDialog: MatDialog,
              public mainService: MainService
              ) { 
    this.productos = data?.productos;
    this.tipoPrecio = data?.tipoPrecio;
    this.cantidad = +data?.cantidad;
    this.tiposPrecios = data?.tiposPrecios;
  }

  ngOnInit(): void {
    this.createForm()
    this.setFocusToCantidad()

    this.formGroup.controls.cantidad.valueChanges.subscribe(res => {
      if(res == 0 || res == null){
        this.formGroup.controls.cantidad.setValue(1)
        this.setFocusToCantidad()
      }
    })
  }

  createForm(){
    this.formGroup = new FormGroup({
      cantidad: new FormControl(null)
    })
    if(this.data.cantidad>0){
      this.formGroup.get('cantidad').setValue(this.data.cantidad);
    } else {
      this.formGroup.get('cantidad').setValue(1);
    }
  }

  cambiarTipoPrecio(tipo){
    this.tipoPrecio = this.tiposPrecios.find(tp => tp.id == tipo);
    this.setFocusToCantidad()
  }

  openTecladoNumerico(){
    let dialog = this.matDialog.open(TecladoNumericoComponent, {
      data: {
        numero: this.cantidad
      }
    })
    dialog.afterClosed().subscribe((res)=>{
      if(res>0){
        this.formGroup.get('cantidad').setValue(res);
      }
      this.setFocusToCantidad()
    });
  }

  onGridCardClick(producto: Producto){
    let response : ProductoCategoriaResponseData = null;
    if(producto!=null){
        response = {
          producto,
          cantidad : this.formGroup.get('cantidad').value,
          tipoPrecio : this.tipoPrecio
        }
      }
      this.dialogRef.close(response);
    }

  setFocusToCantidad(){
    setTimeout(() => {
    this.cantidadInput.nativeElement.focus()
    this.cantidadInput.nativeElement.select()
    }, 0);
  }

  setCantidad(i){
    let cantidad = this.formGroup.controls.cantidad.value
    if(cantidad == 1){
      this.formGroup.controls.cantidad.setValue(i)
    } else {
      this.formGroup.controls.cantidad.setValue(cantidad + i)
    }
  }
}
