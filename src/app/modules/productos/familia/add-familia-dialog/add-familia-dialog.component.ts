import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FamiliaService } from '../familia.service';
import { FamiliaInput } from '../graphql/familia-input.model';
import { icons } from '../../../../commons/core/icons';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

import { Familia } from '../familia.model';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { SelectIconDialogComponent } from '../../../../shared/select-icon-dialog/select-icon-dialog.component';

export interface AddFamiliaData {
  familia: Familia;
}

@Component({
  selector: 'app-add-familia-dialog',
  templateUrl: './add-familia-dialog.component.html',
  styleUrls: ['./add-familia-dialog.component.scss'],
})
export class AddFamiliaDialogComponent implements OnInit {
  familiaInput: FamiliaInput;
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
    @Inject(MAT_DIALOG_DATA) public data: AddFamiliaData,
    public mainService: MainService,
    private familiaService: FamiliaService,
    private dialogRef: MatDialogRef<AddFamiliaDialogComponent>,
    private matDialog: MatDialog,
    private notificationBar: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadData();
    this.familiaService.onCountFamilia().subscribe((res) => {
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
    if (this.data?.familia != null) {
      console.log(this.data.familia)
      this.idControl.setValue(this.data.familia.id);
      this.nombreControl.setValue(this.data.familia.nombre);
      this.descripcionControl.setValue(this.data.familia?.descripcion);
      this.activoControl.setValue(this.data.familia?.activo);
      this.iconoControl.setValue(this.data.familia?.icono);
      this.posicionControl.setValue(this.data.familia.posicion)
    }
  }

  searchIcon() {
    this.matDialog
      .open(SelectIconDialogComponent, {
        width: '600px',
        height: '500px',
      })
      .afterClosed()
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
    this.familiaInput = new FamiliaInput();
    if(this.data?.familia!=null){
      this.familiaInput.id = this.data.familia.id;
      this.familiaInput.posicion = this.posicionControl.value;
    } else {
      this.familiaInput.posicion = this.listPos.length+1;
    }
    this.familiaInput.nombre = this.nombreControl.value?.toUpperCase();
    this.familiaInput.descripcion =
      this.descripcionControl.value?.toUpperCase();
    this.familiaInput.activo = true;
    this.familiaInput.icono = this.iconoControl.value;
    this.familiaService.onSaveFamilia(this.familiaInput).subscribe((res) => {
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
