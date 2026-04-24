import { Component, Inject, OnInit } from '@angular/core';
import { SubCategoriaObservacion } from '../sub-categoria-observacion.model';
import { SubCategoriaObservacionInput } from '../sub-categoria-observacion.input';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { SubCategoriaObservacionService } from '../sub-categoria-observacion.service';
import { CategoriaObservacionService } from '../../categoria-observacion/categoria-observacion.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { CategoriaObservacion } from '../../categoria-observacion/categoria-observacion.model';

export interface AddSubcategoriaObsData {
  categoriaObservacionId: number;
  subcategoriaObservacion: SubCategoriaObservacion;
  categoriaPreselected?: CategoriaObservacion;
}

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'add-subcategoria-obs-dialog',
  templateUrl: './add-subcategoria-obs-dialog.component.html',
  styleUrls: ['./add-subcategoria-obs-dialog.component.scss']
})
export class AddSubcategoriaObsDialogComponent implements OnInit{

  subCategoriaObservacionInput: SubCategoriaObservacionInput;
  formGroup: FormGroup;
  categoriaObsList: CategoriaObservacion[];

  idControl = new FormControl(null);
  descripcionControl = new FormControl(null, Validators.required);
  categoriaObsControl = new FormControl({value: null, disabled: true}, Validators.required);
  usuarioIdControl = new FormControl(null);
  activoControl = new FormControl(true);

  isCancelar = true;
  isGuardar = true;
  isEditar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddSubcategoriaObsData,
    public mainService: MainService,
    private subCategoriaObsService: SubCategoriaObservacionService,
    private categoriaObsService: CategoriaObservacionService,
    private dialogRef: MatDialogRef<AddSubcategoriaObsDialogComponent>,
    private matDialog: MatDialog,
    private notificationBar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    if (this.data?.categoriaPreselected) {
      this.categoriaObsControl.setValue(this.data.categoriaPreselected);
    }
    

    this.categoriaObsService.categoriaObsBS
      .pipe(untilDestroyed(this))
      .subscribe((categorias: CategoriaObservacion[]) => {
        this.categoriaObsList = categorias;
      });
    this.createForm();
    this.loadData();
    this.usuarioIdControl.setValue(this.mainService.usuarioActual?.id);
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl('id', this.idControl);
    this.formGroup.addControl('descripcion', this.descripcionControl);
    this.formGroup.addControl('categoriaObs', this.categoriaObsControl);
    this.formGroup.addControl('activo', this.activoControl);
  }

  loadData() {
    if (this.data?.subcategoriaObservacion != null) {
      this.idControl.setValue(this.data.subcategoriaObservacion.id);
      this.descripcionControl.setValue(this.data.subcategoriaObservacion.descripcion);
      this.categoriaObsControl.setValue(
        this.data.subcategoriaObservacion.categoriaObservacion?.id ||
        this.data.subcategoriaObservacion.categoriaObservacion);
      this.activoControl.setValue(this.data.subcategoriaObservacion?.activo);
    }
  }

  onCancelar() {
    this.dialogRef.close();
  }

  onGuardar() {
    this.onSave();
  }

  onEditar() {

  }

  onSave() {
    this.subCategoriaObservacionInput = new SubCategoriaObservacionInput();

    if (this.data?.subcategoriaObservacion) {
      this.subCategoriaObservacionInput.id = this.data.subcategoriaObservacion.id;
    }
    if (this.data?.categoriaObservacionId) {
      this.subCategoriaObservacionInput.categoriaObservacionId = this.data.categoriaObservacionId;
    } else {
      this.subCategoriaObservacionInput.categoriaObservacionId = this.categoriaObsControl.value?.id
        || this.categoriaObsControl.value;
    }
    this.subCategoriaObservacionInput.descripcion = this.descripcionControl.value?.toUpperCase();
    this.subCategoriaObservacionInput.activo = this.activoControl.value;
    this.subCategoriaObservacionInput.usuarioId = this.mainService.usuarioActual?.id;
    
    this.subCategoriaObsService.onSaveSubCategoriaObservacion(this.subCategoriaObservacionInput)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (res != null) {

          if (!res.descripcion || res.descripcion === '') {
            res.descripcion = this.descripcionControl.value?.toUpperCase();
          }

          if (!res.categoriaObservacion) {
            const cat = this.categoriaObsList.find(c => 
              c.id === (this.categoriaObsControl.value?.id || this.categoriaObsControl.value) 
            );
            res.categoriaObservacion = cat;
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
