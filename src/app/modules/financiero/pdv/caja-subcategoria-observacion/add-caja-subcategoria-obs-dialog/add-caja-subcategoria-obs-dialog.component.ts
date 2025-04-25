import { Component, Inject, OnInit } from '@angular/core';
import { CajaSubCategoriaObservacion } from '../caja-subcategoria-observacion.model';
import { CajaCategoriaObservacion } from '../../caja-categoria-observacion/caja-categoria-observacion.model';
import { SubCategoriaObservacionInput } from '../../../../operaciones/sub-categoria-observacion/sub-categoria-observacion.input';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../../main.service';
import { CajaSubCategoriaObservacionService } from '../caja-subcategoria-observacion.service';
import { CategoriaObservacionService } from '../../../../operaciones/categoria-observacion/categoria-observacion.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../../notificacion-snackbar.service';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { CajaCategoriaObservacionService } from '../../caja-categoria-observacion/caja-categoria-observacion.service';
import { CajaSubCategoriaObservacionInput } from '../caja-subcategoria-observacion-input.model';

export interface AddCajaSubCategoriaObsData {
  cajaCategoriaObservacionId: number;
  cajaSubCategoriaObservacion: CajaSubCategoriaObservacion;
  cajaCategoriaPreselected?: CajaCategoriaObservacion;
}
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'add-caja-subcategoria-obs-dialog',
  templateUrl: './add-caja-subcategoria-obs-dialog.component.html',
  styleUrls: ['./add-caja-subcategoria-obs-dialog.component.scss']
})
export class AddCajaSubCategoriaObsDialogComponent implements OnInit{

  cajaSubCategoriaObservacionInput: CajaSubCategoriaObservacionInput;
  formGroup: FormGroup;
  cajaCategoriaObsList: CajaCategoriaObservacion[];

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null, Validators.required);
  cajaCategoriaObsControl = new FormControl({value: null, disabled: true}, Validators.required);
  usuarioIdControl = new FormControl(null);
  activoControl = new FormControl(true);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddCajaSubCategoriaObsData,
    public mainService: MainService,
    private cajaSubCategoriaObsService: CajaSubCategoriaObservacionService,
    private cajaCategoriaObsService: CajaCategoriaObservacionService,
    private dialogRef: MatDialogRef<AddCajaSubCategoriaObsDialogComponent>,
    private matDialog: MatDialog,
    private notificationBar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    if (this.data?.cajaCategoriaPreselected) {
      this.cajaCategoriaObsControl.setValue(this.data.cajaCategoriaPreselected);
    }
    

    this.cajaCategoriaObsService.cajaCategoriaObsBS
      .pipe(untilDestroyed(this))
      .subscribe((cajaCategorias: CajaCategoriaObservacion[]) => {
        this.cajaCategoriaObsList = cajaCategorias;
      });
    this.createForm();
    this.loadData();
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl('id', this.idControl);
    this.formGroup.addControl('descripcion', this.descripcionControl);
    this.formGroup.addControl('cajaCategoriaObs', this.cajaCategoriaObsControl);
    this.formGroup.addControl('activo', this.activoControl);
  }

  loadData() {
    if (this.data?.cajaSubCategoriaObservacion != null) {
      this.idControl.setValue(this.data.cajaSubCategoriaObservacion.id);
      this.descripcionControl.setValue(this.data.cajaSubCategoriaObservacion.descripcion);
      this.cajaCategoriaObsControl.setValue(
        this.data.cajaSubCategoriaObservacion.cajaCategoriaObservacion?.id ||
        this.data.cajaSubCategoriaObservacion.cajaCategoriaObservacion);
      this.activoControl.setValue(this.data.cajaSubCategoriaObservacion?.activo);
    }
  }

  onCancelar() {
    this.descripcionControl.reset();
    this.cajaCategoriaObsControl.reset();
    this.activoControl.setValue(true);
  }

  onGuardar() {
    this.onSave();
  }

  onEditar() {

  }

  onSave() {
    this.cajaSubCategoriaObservacionInput = new CajaSubCategoriaObservacionInput();

    if (this.data?.cajaSubCategoriaObservacion) {
      this.cajaSubCategoriaObservacionInput.id = this.data.cajaSubCategoriaObservacion.id;
    }
    if (this.data?.cajaCategoriaObservacionId) {
      this.cajaSubCategoriaObservacionInput.cajaCategoriaObsId = this.data.cajaCategoriaObservacionId;
    } else {
      this.cajaSubCategoriaObservacionInput.cajaCategoriaObsId = this.cajaCategoriaObsControl.value?.id
        || this.cajaCategoriaObsControl.value;
    }
    this.cajaSubCategoriaObservacionInput.descripcion = this.descripcionControl.value?.toUpperCase();
    this.cajaSubCategoriaObservacionInput.activo = this.activoControl.value;
    if (this.data?.cajaCategoriaPreselected) {
      this.cajaSubCategoriaObservacionInput.cajaCategoriaObsId = this.data.cajaCategoriaPreselected.id;
    }
    
    this.cajaSubCategoriaObsService.onSaveCajaSubCategoriaObservacion(this.cajaSubCategoriaObservacionInput)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {

          if (!res.descripcion || res.descripcion === '') {
            res.descripcion = this.descripcionControl.value?.toUpperCase();
          }

          if (!res.cajaCategoriaObservacion) {
            const cat = this.cajaCategoriaObsList.find(c => 
              c.id === (this.cajaCategoriaObsControl.value?.id || this.cajaCategoriaObsControl.value) 
            );
            res.cajaCategoriaObservacion = cat;
          }

          this.dialogRef.close(res);
          this.notificationBar.notification$.next({
            texto: 'Guardado con éxito',
            color: NotificacionColor.success,
            duracion: 2,
          });
        }
      }, (error) => {
        console.error('Save Error:', error);
      });
  }
  

}

