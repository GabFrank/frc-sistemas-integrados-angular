import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { untilDestroyed } from '@ngneat/until-destroy';
import { FacturaLegalItem } from '../factura-legal.model';

export interface AdicionarFacturaLegalItemData {
  facturaItem: FacturaLegalItem;
}

@Component({
  selector: 'app-edit-factura-legal-item',
  templateUrl: './edit-factura-legal-item.component.html',
  styleUrls: ['./edit-factura-legal-item.component.scss']
})
export class EditFacturaLegalItemComponent implements OnInit {

  selectedFacturaLegalItem = new FacturaLegalItem;
  descripcionControl = new FormControl(null, Validators.required)
  cantidadControl = new FormControl(1, Validators.required)
  precioUnitario = new FormControl(null, Validators.required)
  formGroup: FormGroup;
  isEditting = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: AdicionarFacturaLegalItemData,
    private dialogRef: MatDialogRef<EditFacturaLegalItemComponent>,
  ) { }

  ngOnInit(): void {

    this.formGroup = new FormGroup({
      descripcion: this.descripcionControl,
      cantidad: this.cantidadControl,
      precioUnitario: this.precioUnitario,
    })

    if (this.data.facturaItem != null) {
      Object.assign(this.selectedFacturaLegalItem, this.data.facturaItem)
      this.cargarDatos()
    } else {
      this.isEditting = true;
    }
  }

  cargarDatos() {
    this.descripcionControl.setValue(this.selectedFacturaLegalItem.descripcion)
    this.cantidadControl.setValue(this.selectedFacturaLegalItem.cantidad)
    this.precioUnitario.setValue(this.selectedFacturaLegalItem.precioUnitario)
    this.formGroup.disable()
  }

  onEdit() {
    this.isEditting = true;
    this.formGroup.enable()
  }

  onCancel() {
    this.dialogRef.close(null)
  }

  onSave() {
    this.selectedFacturaLegalItem.descripcion = this.descripcionControl.value
    this.selectedFacturaLegalItem.cantidad = this.cantidadControl.value
    this.selectedFacturaLegalItem.precioUnitario = this.precioUnitario.value;
    this.selectedFacturaLegalItem.total = this.cantidadControl.value * this.precioUnitario.value;
    this.dialogRef.close(this.selectedFacturaLegalItem)
  }

}
