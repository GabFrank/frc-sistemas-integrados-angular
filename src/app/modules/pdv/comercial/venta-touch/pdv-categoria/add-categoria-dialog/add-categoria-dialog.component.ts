import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { PdvCategoriaInput } from '../pdv-categoria-input.model';
import { PdvCategoriaService } from '../pdv-categoria.service';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-categoria-dialog',
  templateUrl: './add-categoria-dialog.component.html',
  styleUrls: ['./add-categoria-dialog.component.scss']
})
export class AddCategoriaDialogComponent implements OnInit {

  descripcionControl = new FormControl;

  constructor(
    private service: PdvCategoriaService,
    private dialogRef: MatDialogRef<AddCategoriaDialogComponent>
  ) { }

  ngOnInit(): void {
  }

  onSave(){
    let input = new PdvCategoriaInput
    input.descripcion = this.descripcionControl.value;
    input.activo = true;
    this.service.onSaveCategoria(input).pipe(untilDestroyed(this)).subscribe(res => {
      if(res['data']!=null){
        this.dialogRef.close(res['data'])
      }
    })
  }

  onGuardar(){
    this.onSave()
  }

  onCancelar(){
    this.dialogRef.close()
  }

}
