import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PdvCategoria } from '../pdv-categoria/pdv-categoria.model';
import { PdvGrupo } from '../pdv-grupo/pdv-grupo.model';
import { PdvGruposProductos } from '../pdv-grupos-productos/pdv-grupos-productos.model';

class Data {
  pdvCategoria: PdvCategoria
  pdvGrupo: PdvGrupo
}

@Component({
  selector: 'app-adicionar-pdv-producto-dialog',
  templateUrl: './adicionar-pdv-producto-dialog.component.html',
  styleUrls: ['./adicionar-pdv-producto-dialog.component.scss']
})
export class AdicionarPdvProductoDialogComponent implements OnInit {

  descripcionControl = new FormControl();
  posicionControl = new FormControl();
  activoControl = new FormControl(true);
  selectedGrupoProducto : PdvGruposProductos;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Data,
    public dialogRef: MatDialogRef<AdicionarPdvProductoDialogComponent>,
  ) { 
    if(data?.pdvGrupo!=null){
      console.log(data)
      this.cargarDatos(data.pdvGrupo)
    } 
  }

  ngOnInit(): void {
  }

  cargarDatos(pdvGrupo: PdvGrupo){
    this.descripcionControl.setValue(pdvGrupo.descripcion);
  }

  onSelectProducto(pdvGrupoProducto: PdvGruposProductos){
    this.selectedGrupoProducto = pdvGrupoProducto;
  }

  onDeleteGrupoProducto(){}

}
