import { Component, Inject, OnInit } from '@angular/core';
import { CajaMotivoObservacion } from '../caja-motivo-observacion.model';
import { CajaSubCategoriaObservacion } from '../../caja-subcategoria-observacion/caja-subcategoria-observacion.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaMotivoObservacionInput } from '../caja-motivo-observacion-input.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../../main.service';
import { CajaMotivoObservacionService } from '../caja-motivo-observacion.service';
import { CajaSubCategoriaObservacionService } from '../../caja-subcategoria-observacion/caja-subcategoria-observacion.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';

export interface AddCajaMotivoObservacionData {
  cajaSubCategoriaObsId: number;
  cajaMotivoObservacion: CajaMotivoObservacion;
  cajaSubCategoriaPreselected?: CajaSubCategoriaObservacion;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'add-caja-motivo-obs-dialog',
  templateUrl: './add-caja-motivo-obs-dialog.component.html',
  styleUrls: ['./add-caja-motivo-obs-dialog.component.scss']
})
export class AddCajaMotivoObsDialogComponent implements OnInit{

  cajaMotivoObservacionInput: CajaMotivoObservacionInput;
  formGroup: FormGroup;
  cajaSubCategoriaObsList: CajaSubCategoriaObservacion[];

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null, Validators.required);
  activoControl = new FormControl(true);
  cajaSubCategoriaObsControl = new FormControl({ value: null, disabled: true}, Validators.required);
  usuarioIdControl = new FormControl(null);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddCajaMotivoObservacionData,
    public mainService: MainService,
    private cajaMotivoObservacionService: CajaMotivoObservacionService,
    private cajaSubCategoriaObsService: CajaSubCategoriaObservacionService,
    private dialogRef: MatDialogRef<AddCajaMotivoObsDialogComponent>,
    private matDialog: MatDialog,
    private notificationBar: NotificacionSnackbarService,
  ) {
  }

  ngOnInit(): void {
    if (this.data?.cajaSubCategoriaPreselected) {
      this.cajaSubCategoriaObsControl.setValue(this.data.cajaSubCategoriaPreselected);
    }

    this.cajaSubCategoriaObsService.cajaSubCategoriaObservacionBS
      .pipe(untilDestroyed(this))
      .subscribe((cajaSubCategorias: CajaSubCategoriaObservacion[]) => {
        this.cajaSubCategoriaObsList = cajaSubCategorias;
      });
    this.createForm();
    this.loadData();
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl('id', this.idControl);
    this.formGroup.addControl('descripcion', this.descripcionControl);
    this.formGroup.addControl('activo', this.activoControl);
    this.formGroup.addControl('cajaSubCategoriaObs', this.cajaSubCategoriaObsControl);
  }

  loadData() {
    if (this.data?.cajaMotivoObservacion != null) {
      this.idControl.setValue(this.data.cajaMotivoObservacion.id);
      this.descripcionControl.setValue(this.data.cajaMotivoObservacion.descripcion);
      this.activoControl.setValue(this.data.cajaMotivoObservacion?.activo);
      this.cajaSubCategoriaObsControl.setValue(
        this.data.cajaMotivoObservacion.cajaSubCategoriaObservacion?.id ||
        this.data.cajaMotivoObservacion.cajaSubCategoriaObservacion);
    }
  }

  onCancelar() {
    this.descripcionControl.reset();
    this.cajaSubCategoriaObsControl.reset();
    this.activoControl.setValue(true);
  }

  onGuardar() {
    this.onSave();
  }
  
  onEditar() {}
  
  onSave() {
    this.cajaMotivoObservacionInput = new CajaMotivoObservacionInput();

    if (this.data?.cajaMotivoObservacion) {
      this.cajaMotivoObservacionInput.id = this.data.cajaMotivoObservacion.id;
    }
    if (this.data?.cajaSubCategoriaObsId) {
      this.cajaMotivoObservacionInput.id = this.data.cajaSubCategoriaObsId;
    } else {
      this.cajaMotivoObservacionInput.cajaSubCategoriaObsId = this.cajaSubCategoriaObsControl.value?.id
        || this.cajaSubCategoriaObsControl.value;
    }
    this.cajaMotivoObservacionInput.descripcion = this.descripcionControl.value?.toUpperCase();
    this.cajaMotivoObservacionInput.activo = this.activoControl.value;
    this.cajaMotivoObservacionService.onSaveCajaMotivoObservacion(this.cajaMotivoObservacionInput)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {
          if (!res.descripcion || res.descripcion === '') {
            res.descripcion = this.descripcionControl.value?.toUpperCase();
          }

          if (!res.cajaSubcategoriaObservacion) {
            const cajaSubCat = this.cajaSubCategoriaObsList.find(cajaSub =>
              cajaSub.id === (this.cajaSubCategoriaObsControl.value?.id || this.cajaSubCategoriaObsControl.value)
            );
            res.cajaSubcategoriaObservacion = cajaSubCat;
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