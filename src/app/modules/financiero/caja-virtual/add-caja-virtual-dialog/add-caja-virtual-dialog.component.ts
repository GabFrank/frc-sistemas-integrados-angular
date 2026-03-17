import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CajaVirtual, CajaVirtualTipo } from '../caja-virtual.model';
import { CajaVirtualService } from '../caja-virtual.service';
import { NotificacionSnackbarService } from '../../../../notificacion-snackbar.service';

@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-add-caja-virtual-dialog',
  templateUrl: './add-caja-virtual-dialog.component.html',
  styleUrls: ['./add-caja-virtual-dialog.component.scss']
})
export class AddCajaVirtualDialogComponent implements OnInit {

  formGroup: FormGroup;
  nombreControl = new FormControl('', Validators.required);
  tipoControl = new FormControl(CajaVirtualTipo.CAJA_MAYOR, Validators.required);
  descripcionControl = new FormControl();
  limiteGsControl = new FormControl();
  activoControl = new FormControl(true);

  isEditing = false;
  isSaving = false;

  tipoList = [
    { label: 'Caja Mayor', value: CajaVirtualTipo.CAJA_MAYOR },
    { label: 'Caja Chica', value: CajaVirtualTipo.CAJA_CHICA }
  ];

  constructor(
    private dialogRef: MatDialogRef<AddCajaVirtualDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CajaVirtual,
    private cajaVirtualService: CajaVirtualService,
    private notificacion: NotificacionSnackbarService
  ) {}

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombreControl: this.nombreControl,
      tipoControl: this.tipoControl,
      descripcionControl: this.descripcionControl,
      limiteGsControl: this.limiteGsControl,
      activoControl: this.activoControl
    });

    if (this.data != null) {
      this.isEditing = true;
      this.nombreControl.setValue(this.data.nombre);
      this.tipoControl.setValue(this.data.tipo);
      this.descripcionControl.setValue(this.data.descripcion);
      this.limiteGsControl.setValue(this.data.limiteGs);
      this.activoControl.setValue(this.data.activo);
    }
  }

  onSave() {
    if (this.formGroup.invalid) return;

    const cajaVirtual = new CajaVirtual();
    if (this.isEditing) cajaVirtual.id = this.data.id;
    cajaVirtual.nombre = this.nombreControl.value?.toUpperCase();
    cajaVirtual.tipo = this.tipoControl.value;
    cajaVirtual.descripcion = this.descripcionControl.value;
    cajaVirtual.limiteGs = this.limiteGsControl.value;
    cajaVirtual.activo = this.activoControl.value;

    this.isSaving = true;
    this.cajaVirtualService.onSave(cajaVirtual)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: res => {
          this.isSaving = false;
          if (res != null) {
            this.notificacion.openSucess('Caja virtual guardada correctamente');
            this.dialogRef.close(res);
          }
        },
        error: () => {
          this.isSaving = false;
          this.notificacion.openAlgoSalioMal('Error al guardar la caja virtual');
        }
      });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
