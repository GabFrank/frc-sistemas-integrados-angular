import { Component, Inject, OnInit } from '@angular/core';
import { CajaCategoriaObservacion } from '../caja-categoria-observacion.model';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CajaCategoriaObservacionInput } from '../caja-categoria-observacion-input.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../../main.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { CajaCategoriaObservacionService } from '../caja-categoria-observacion.service';

export interface AddCajaCategoriaObsData {
  cajaCategoriaObs: CajaCategoriaObservacion;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'add-cajaCategoria-obs-dialog',
  templateUrl: './add-caja-categoria-obs-dialog.component.html',
  styleUrls: ['./add-caja-categoria-obs-dialog.component.scss']
})
export class AddCajaCategoriaObsDialogComponent implements OnInit {
 
  cajaCategoriaObsInput: CajaCategoriaObservacionInput;
  formGroup: FormGroup;

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null, Validators.required);
  usuarioIdControl = new FormControl(null);
  activoControl = new FormControl(true);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddCajaCategoriaObsData,
    public mainService: MainService,
    private dialogRef: MatDialogRef<AddCajaCategoriaObsDialogComponent>,
    private matDialog: MatDialog,
    private notificationBar: NotificacionSnackbarService,
    private cajaCategoriaObservacionService: CajaCategoriaObservacionService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadData();
    this.usuarioIdControl.setValue(this.mainService.usuarioActual?.id);
  }

  createForm() {
    this.formGroup = new FormGroup({});
      this.formGroup.addControl('id', this.idControl);
      this.formGroup.addControl('descripcion', this.descripcionControl);
      this.formGroup.addControl('usuarioId', this.usuarioIdControl);
      this.formGroup.addControl('activo', this.activoControl);
    
  }

  loadData() {
    if (this.data?.cajaCategoriaObs != null) {
      this.idControl.setValue(this.data.cajaCategoriaObs.id);
      this.descripcionControl.setValue(this.data.cajaCategoriaObs?.descripcion);
      this.activoControl.setValue(this.data.cajaCategoriaObs?.activo);
    }
  }

  onCancelar() {
    this.dialogRef.close();
  }

  onEditar() {

  }

  onGuardar() {
    this.onSave();
  }

  onSave() {
    this.cajaCategoriaObsInput = new CajaCategoriaObservacionInput();
    if (this.data?.cajaCategoriaObs) {
      this.cajaCategoriaObsInput.id = this.data.cajaCategoriaObs.id;
      this.cajaCategoriaObsInput.descripcion = this.data.cajaCategoriaObs.descripcion;
    }
  
    this.cajaCategoriaObsInput.descripcion = this.descripcionControl.value?.toUpperCase();
    this.cajaCategoriaObsInput.activo = this.activoControl.value;
    this.cajaCategoriaObsInput.usuarioId = this.mainService.usuarioActual?.id;
    
    this.cajaCategoriaObservacionService.onSaveCajaCategoriaObservacion(this.cajaCategoriaObsInput)
      .subscribe({
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
      });
  }
  
}
