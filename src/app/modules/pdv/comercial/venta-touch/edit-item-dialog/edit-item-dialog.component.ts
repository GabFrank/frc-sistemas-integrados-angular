import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { TecladoNumericoComponent } from '../../../../../shared/components/teclado-numerico/teclado-numerico.component';
import { Item } from '../venta-touch.component';

export class EditItemData {
  item: Item;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-edit-item-dialog',
  templateUrl: './edit-item-dialog.component.html',
  styleUrls: ['./edit-item-dialog.component.css'],
})
export class EditItemDialogComponent implements OnInit {

  formGroup;
  item: Item;
  dialog;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditItemData,
    public dialogRef: MatDialogRef<EditItemDialogComponent>,
    public matDialog: MatDialog
  ) {
    this.item = data.item;
  }

  ngOnInit(): void {
    this.createForm()
  }

  createForm(){
    this.formGroup = new FormGroup({
      cantidad: new FormControl(null)
    })
    if(this.item.caja){
      this.formGroup.get('cantidad').setValue(this.item.cantidad / this.item.unidadPorCaja)
    } else {
      this.formGroup.get('cantidad').setValue(this.item.cantidad)
    }
  }

  calcularCantidad(i){
    if(this.formGroup.get('cantidad').value != 0 || i>0){
      this.formGroup.get('cantidad').setValue(+(this.formGroup.get('cantidad').value) + +i);
    }
  }

  openTecladoNumerico(){
    this.dialog = this.matDialog.open(TecladoNumericoComponent, {
      data: {
        numero: this.formGroup.get('cantidad').value
      }
    })
    this.dialog.afterClosed().pipe(untilDestroyed(this)).subscribe((res)=>{
      if(res>0){
        this.formGroup.get('cantidad').setValue(res);
      }
    });
  }

  onGuardar(){
    if(this.item.caja){
      this.dialogRef.close(this.formGroup.get('cantidad').value * this.item.unidadPorCaja);
    } else {
      this.dialogRef.close(this.formGroup.get('cantidad').value);
    }
  }

  onEliminar(){
    this.dialogRef.close(-1);
  }
}
