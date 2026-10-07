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

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GraphQLError } from 'graphql';
import { finalize } from 'rxjs/operators';
import { esRechazoDelServidor } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';

@UntilDestroy({ checkProperties: true })
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
  /** Guardando: sin doble «Guardar» y sin cerrar el diálogo (Esc o clic afuera) hasta saber qué pasó. */
  guardando = false;

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
  }

  createForm() {
    this.formGroup = new FormGroup({
      nombre: this.nombreControl,
      descripcion: this.descripcionControl,
      activo: this.activoControl
    });
  }

  loadData() {
    if (this.data?.familia != null) {
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
    if (this.guardando) return;
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
    this.guardando = true;
    this.dialogRef.disableClose = true;
    const fin = () => {
      this.guardando = false;
      this.dialogRef.disableClose = false;
    };
    this.familiaService.onSaveFamilia(this.familiaInput).pipe(untilDestroyed(this), finalize(fin)).subscribe({
      next: (res) => {
        fin();
        // «Guardado con éxito» ya lo muestra el servicio
        if (res != null) this.dialogRef.close(res);
      },
      error: (error) => {
        fin();
        // Rechazo del servidor: el servicio ya avisó. En el corte por tiempo avisa el link.
        if (esRechazoDelServidor(error) || esTimeoutDeLink(error)) return;
        // Sin respuesta (también la respuesta vacía, que el servicio solo nombra): pudo haberse guardado. Reintentar es seguro: el nombre de la familia es único en el
        // servidor (alta) y la edición lleva su id.
        this.notificationBar.openWarn(
          'No se pudo confirmar el guardado. Podés volver a intentar: si ya se había guardado, el servidor rechaza el nombre repetido.', 8);
      }
    });
  }
}
