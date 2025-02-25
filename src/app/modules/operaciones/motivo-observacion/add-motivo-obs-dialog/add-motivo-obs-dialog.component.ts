import { Component, Inject, OnInit } from '@angular/core';
import { MotivoObservacion } from '../motivo-observacion.model';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MotivoObservacionInput } from '../motivo-observacion.input';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { SubCategoriaObservacion } from '../../sub-categoria-observacion/sub-categoria-observacion.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { MotivoObservacionService } from '../motivo-observacion.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { error } from 'console';
import { SubCategoriaObservacionService } from '../../sub-categoria-observacion/sub-categoria-observacion.service';

export interface AddMotivoObservacionData {
  subCategoriaObsId: number;
  motivoObservacion: MotivoObservacion;
  subcategoriaPreselected?: SubCategoriaObservacion;

}
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'add-motivo-obs-dialog',
  templateUrl: './add-motivo-obs-dialog.component.html',
  styleUrls: ['./add-motivo-obs-dialog.component.scss']
})
export class AddMotivoObsDialogComponent implements OnInit{

  motivoObservacionInput: MotivoObservacionInput;
  formGroup: FormGroup;
  subCategoriaObsList: SubCategoriaObservacion[];

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(true);
  subCategoriaObsControl = new FormControl({ value: null, disabled: true}, Validators.required);
  usuarioIdControl = new FormControl(null);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddMotivoObservacionData,
    public mainService: MainService,
    private motivoObservacionService: MotivoObservacionService,
    private subCategoriaObsService: SubCategoriaObservacionService,
    private dialogRef: MatDialogRef<AddMotivoObsDialogComponent>,
    private matDialog: MatDialog,
    private notificationBar: NotificacionSnackbarService,
  ) {
  }

  ngOnInit(): void {
    if (this.data?.subcategoriaPreselected) {
      this.subCategoriaObsControl.setValue(this.data.subcategoriaPreselected);
    }

    this.subCategoriaObsService.subCategoriaObservacionBS
      .pipe(untilDestroyed(this))
      .subscribe((subCategorias: SubCategoriaObservacion[]) => {
        this.subCategoriaObsList = subCategorias;
      });
    this.createForm();
    this.loadData();
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl('id', this.idControl);
    this.formGroup.addControl('descripcion', this.descripcionControl);
    this.formGroup.addControl('activo', this.activoControl);
    this.formGroup.addControl('subCategoriaObs', this.subCategoriaObsControl);
  }

  loadData() {
    if (this.data?.motivoObservacion != null) {
      this.idControl.setValue(this.data.motivoObservacion.id);
      this.descripcionControl.setValue(this.data.motivoObservacion.descripcion);
      this.activoControl.setValue(this.data.motivoObservacion?.activo);
      this.subCategoriaObsControl.setValue(
        this.data.motivoObservacion.subcategoriaObservacion?.id ||
        this.data.motivoObservacion.subcategoriaObservacion);
    }
  }

  onCancelar() {
    this.descripcionControl.reset();
    this.subCategoriaObsControl.reset();
    this.activoControl.setValue(true);
  }

  onGuardar() {
    this.onSave();
  }
  
  onEditar() {}
  
  onSave() {
    this.motivoObservacionInput = new MotivoObservacionInput();

    if (this.data?.motivoObservacion) {
      this.motivoObservacionInput.id = this.data.motivoObservacion.id;
    }
    if (this.data?.subCategoriaObsId) {
      this.motivoObservacionInput.id = this.data.subCategoriaObsId;
    } else {
      this.motivoObservacionInput.subcategoriaObservacionId = this.subCategoriaObsControl.value?.id
        || this.subCategoriaObsControl.value;
    }
    this.motivoObservacionInput.descripcion = this.descripcionControl.value?.toUpperCase();
    this.motivoObservacionInput.activo = this.activoControl.value;
    this.motivoObservacionService.onSaveMotivoObservacion(this.motivoObservacionInput)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          if (!res.descripcion || res.descripcion === '') {
            res.descripcion = this.descripcionControl.value?.toUpperCase();
          }

          if (!res.subcategoriaObservacion) {
            const subCat = this.subCategoriaObsList.find(sub =>
              sub.id === (this.subCategoriaObsControl.value?.id || this.subCategoriaObsControl.value)
            );
            res.subcategoriaObservacion = subCat;
          }
          this.dialogRef.close(res);
          this.notificationBar.notification$.next({
            texto: 'Guardado con éxito',
            color: NotificacionColor.success,
            duracion: 2,
          });
        }
      }, (error) => {
        console.error('Save error:', error);
      });
  }
}
