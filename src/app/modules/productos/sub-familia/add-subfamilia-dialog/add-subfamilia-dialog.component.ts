import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MainService } from '../../../../main.service';
import { NotificacionColor, NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';
import { SelectIconDialogComponent } from '../../../../shared/select-icon-dialog/select-icon-dialog.component';
import { SubfamiliaInput } from '../graphql/subfamilia-input.model';
import { Subfamilia } from '../sub-familia.model';
import { SubFamiliaService } from '../sub-familia.service';

export interface AddSubfamiliaData {
  familiaId: number;
  subfamilia: Subfamilia;
}

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-subfamilia-dialog',
  templateUrl: './add-subfamilia-dialog.component.html',
  styleUrls: ['./add-subfamilia-dialog.component.scss']
})
export class AddSubfamiliaDialogComponent implements OnInit {

  subfamiliaInput: SubfamiliaInput;
  formGroup: FormGroup;

  //form controls
  idControl = new FormControl(null);
  nombreControl = new FormControl(null, Validators.required);
  descripcionControl = new FormControl(null);
  activoControl = new FormControl(true);
  posicionControl = new FormControl(null);
  usuarioIdControl = new FormControl(null);
  iconoControl = new FormControl('block');
  listPos: number[] = [];

  //controladores de estado
  isCancelar = true;
  isGuardar = true;
  isEditar = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddSubfamiliaData,
    public mainService: MainService,
    private subfamiliaService: SubFamiliaService,
    private dialogRef: MatDialogRef<AddSubfamiliaDialogComponent>,
    private matDialog: MatDialog,
    private notificationBar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadData();
    this.subfamiliaService.onCountSubfamilia().pipe(untilDestroyed(this)).subscribe((res) => {
      for (let index = 0; index < res + 1; index++) {
        this.listPos.push(index + 1);
      }
    });
  }

  createForm() {
    this.formGroup = new FormGroup({});
    this.formGroup.addControl('id', this.idControl);
    this.formGroup.addControl('nombre', this.nombreControl);
    this.formGroup.addControl('descripcion', this.descripcionControl);
    this.formGroup.addControl('activo', this.activoControl);
    this.formGroup.addControl('posicion', this.posicionControl);
    this.formGroup.addControl('icono', this.iconoControl);
  }

  loadData() {
    if (this.data?.subfamilia != null) {
      console.log(this.data.subfamilia)
      this.idControl.setValue(this.data.subfamilia.id);
      this.nombreControl.setValue(this.data.subfamilia.nombre);
      this.descripcionControl.setValue(this.data.subfamilia?.descripcion);
      this.activoControl.setValue(this.data.subfamilia?.activo);
      this.iconoControl.setValue(this.data.subfamilia?.icono);
      this.posicionControl.setValue(this.data.subfamilia.posicion)
    }
  }

  searchIcon() {
    this.matDialog
      .open(SelectIconDialogComponent, {
        width: '600px',
        height: '500px',
      })
      .afterClosed().pipe(untilDestroyed(this))
      .subscribe((res) => {
        this.iconoControl.setValue(res);
      });
  }

  onCancelar() {
    this.nombreControl.reset();
    this.descripcionControl.reset();
    this.activoControl.setValue(true);
    this.iconoControl.setValue('block');
  }

  onGuardar() {
    this.onSave();
  }

  onEditar() {}

  onSave() {
    this.subfamiliaInput = new SubfamiliaInput();
    if(this.data.subfamilia!=null){
      this.subfamiliaInput.id = this.data.subfamilia.id;
      this.subfamiliaInput.posicion = this.posicionControl.value;
    } else {
      this.subfamiliaInput.posicion = this.listPos.length+1;
    }
    if(this.data.familiaId!=null){
      this.subfamiliaInput.familiaId = this.data.familiaId
    }
    this.subfamiliaInput.nombre = this.nombreControl.value?.toUpperCase();
    this.subfamiliaInput.descripcion =
      this.descripcionControl.value?.toUpperCase();
    this.subfamiliaInput.activo = true;
    this.subfamiliaInput.icono = this.iconoControl.value;
    console.log(this.subfamiliaInput)
    this.subfamiliaService.onSaveSubfamilia(this.subfamiliaInput).pipe(untilDestroyed(this)).subscribe((res) => {
      if (res != null) {
        this.dialogRef.close(res);
        this.notificationBar.notification$.next({
          texto: 'Guardado con éxito',
          color: NotificacionColor.success,
          duracion: 2,
        });
      }
    });
  }

}
