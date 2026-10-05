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
import { esRechazoDelServidor } from '../../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../../shared/services/timeout-link';

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
  /** Guardando: sin doble «Guardar» y sin cerrar el diálogo (Esc o clic afuera) hasta saber qué pasó. */
  guardando = false;
  /**
   * Un ALTA quedó sin respuesta: pudo haberse guardado y las subfamilias no tienen nombre único, así que volver a
   * guardar la duplicaría. Guardar queda bloqueado en este diálogo (#390).
   */
  altaSinConfirmar = false;

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
    this.asegurarPosicionActual();
    // La posición no ordena nada: si el conteo no llega, la lista queda con la posición actual y no se bloquea
    this.subfamiliaService.onCountSubfamilia().pipe(untilDestroyed(this)).subscribe({ error: () => {}, next: (res) => {
      if (res == null) return;
      const posiciones: number[] = [];
      for (let index = 0; index < res + 1; index++) {
        posiciones.push(index + 1);
      }
      this.listPos = posiciones;
      this.asegurarPosicionActual();
    } });
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

  /** En edición, la posición guardada siempre está entre las opciones (si no, el select se ve en blanco). */
  private asegurarPosicionActual(): void {
    // El modelo la trae como texto: se deja tal cual (es el valor que tiene el control)
    const actual: any = this.data?.subfamilia?.posicion;
    if (actual != null && !this.listPos.some((p) => p === actual)) this.listPos = [...this.listPos, actual];
  }

  onCerrar() {
    this.dialogRef.close(null);
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
    if (this.guardando || this.altaSinConfirmar) return;
    const esAlta = this.data.subfamilia == null;
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
    this.guardando = true;
    this.dialogRef.disableClose = true;
    const fin = () => {
      this.guardando = false;
      this.dialogRef.disableClose = false;
    };
    this.subfamiliaService.onSaveSubfamilia(this.subfamiliaInput).pipe(untilDestroyed(this)).subscribe({
      next: (res) => {
        fin();
        // «Guardado con éxito» ya lo muestra el servicio
        if (res != null) this.dialogRef.close(res);
      },
      error: (error) => {
        fin();
        // Rechazo: el servidor dijo que no (ya avisó el servicio); se puede corregir y reintentar
        if (esRechazoDelServidor(error)) return;
        if (esAlta) {
          // Sin respuesta en un alta: pudo haberse guardado. No se reintenta a ciegas.
          this.altaSinConfirmar = true;
          return;
        }
        // Edición: lleva su id, reintentar es inocuo. (Con respuesta vacía ya avisó el servicio; en el corte, el link.)
        if (!Array.isArray(error) && !esTimeoutDeLink(error)) {
          this.notificationBar.openWarn('No se pudo confirmar el guardado: podés volver a intentar.', 6);
        }
      }
    });
  }

}
