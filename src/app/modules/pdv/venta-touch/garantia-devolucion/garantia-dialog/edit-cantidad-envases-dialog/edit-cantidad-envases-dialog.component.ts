import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export class EditCantidadEnvasesData {
  cantidad: number;
}

@Component({
  selector: 'app-edit-cantidad-envases-dialog',
  templateUrl: './edit-cantidad-envases-dialog.component.html',
  styleUrls: ['./edit-cantidad-envases-dialog.component.scss']
})
export class EditCantidadEnvasesDialogComponent implements OnInit {

  cantidadControl = new FormControl(1, [Validators.required, Validators.min(1)])

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: EditCantidadEnvasesData,
    private dialogRef: MatDialogRef<EditCantidadEnvasesDialogComponent>
  ) { }

  ngOnInit(): void {
    if(this.data?.cantidad!=null) {
      this.cantidadControl.setValue(this.data.cantidad)
      this.cantidadControl.setValidators([Validators.required, Validators.min(1) ,Validators.max(this.data.cantidad)])
      this.cantidadControl.updateValueAndValidity()
    }
    if(this.cantidadControl.value == 1) this.dialogRef.close(1)
  }

  onAceptar(){
    this.dialogRef.close(this.cantidadControl.value)
  }

  onCancelar(){
    this.dialogRef.close(null)
  }

}
