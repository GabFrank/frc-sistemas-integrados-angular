import { Component, Inject, OnInit } from '@angular/core';
import { CategoriaObservacion } from '../categoria-observacion.model';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CategoriaObservacionInput } from '../categoria-observacion-input.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CategoriaObservacionService } from '../categoria-observacion.service';

export interface AddCategoriaObsData {
  categoriaObs: CategoriaObservacion;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'add-categoria-obs-dialog',
  templateUrl: './add-categoria-obs-dialog.component.html',
  styleUrls: ['./add-categoria-obs-dialog.component.scss']
})
export class AddCategoriaObsDialogComponent implements OnInit {
 
  categoriaObsInput: CategoriaObservacionInput;
  formGroup: FormGroup;

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null, Validators.required);
  usuarioIdControl = new FormControl(null);
  activoControl = new FormControl(true);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddCategoriaObsData,
    public mainService: MainService,
    private dialogRef: MatDialogRef<AddCategoriaObsDialogComponent>,
    private matDialog: MatDialog,
    private notificationBar: NotificacionSnackbarService,
    private categoriaObservacionService: CategoriaObservacionService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadData();
  }

  createForm() {
    this.formGroup = new FormGroup({});
      this.formGroup.addControl('id', this.idControl);
      this.formGroup.addControl('descripcion', this.descripcionControl);
      this.formGroup.addControl('usuarioId', this.usuarioIdControl);
      this.formGroup.addControl('activo', this.activoControl);
    
  }

  loadData() {
    if (this.data?.categoriaObs != null) {
      this.idControl.setValue(this.data.categoriaObs.id);
      this.descripcionControl.setValue(this.data.categoriaObs?.descripcion);
      this.activoControl.setValue(this.data.categoriaObs?.activo);
    }
  }

  onCancelar() {
    this.descripcionControl.reset();
    this.activoControl.setValue(true);
  }

  onEditar() {

  }

  onGuardar() {
    this.onSave();
  }

  onSave() {
    this.categoriaObsInput = new CategoriaObservacionInput();
    if (this.data?.categoriaObs != null) {
      this.categoriaObsInput.id = this.data.categoriaObs.id;
      this.categoriaObsInput.descripcion = this.data.categoriaObs.descripcion;
    }

    this.categoriaObsInput.descripcion = this.descripcionControl.value?.toUpperCase();
    this.categoriaObsInput.activo = this.activoControl.value;
    this.categoriaObservacionService.onSaveCategoriaObservacion(this.categoriaObsInput).subscribe({
      next: (res) => {
        if (res != null) {
          this.dialogRef.close(res);
          this.notificationBar.notification$.next({
            texto: 'Guardado con éxito',
            color: NotificacionColor.success,
            duracion: 2,
          });
        }
      }
    })
  }
}
