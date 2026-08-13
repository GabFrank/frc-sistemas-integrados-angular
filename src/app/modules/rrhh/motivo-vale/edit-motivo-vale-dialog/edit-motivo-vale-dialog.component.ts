import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { MotivoVale } from '../motivo-vale.model';
import { MotivoValeService } from '../motivo-vale.service';

export interface MotivoValeDialogData {
  motivo: MotivoVale;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-motivo-vale-dialog',
  templateUrl: './edit-motivo-vale-dialog.component.html',
  styleUrls: ['./edit-motivo-vale-dialog.component.scss']
})
export class EditMotivoValeDialogComponent implements OnInit {

  selectedMotivo: MotivoVale;
  formGroup: FormGroup;
  isEditting = false;

  nombreControl = new FormControl(null, [Validators.required]);
  descripcionControl = new FormControl(null);
  activoControl = new FormControl(true);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: MotivoValeDialogData,
    private dialogRef: MatDialogRef<EditMotivoValeDialogComponent>,
    private motivoValeService: MotivoValeService,
    private mainService: MainService
  ) {
    this.selectedMotivo = data?.motivo != null ? data.motivo : new MotivoVale();
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombre: this.nombreControl,
      descripcion: this.descripcionControl,
      activo: this.activoControl
    });
    if (this.selectedMotivo.id) {
      this.nombreControl.setValue(this.selectedMotivo.nombre);
      this.descripcionControl.setValue(this.selectedMotivo.descripcion);
      this.activoControl.setValue(this.selectedMotivo.activo ?? true);
      this.formGroup.disable();
    } else {
      this.isEditting = true;
    }
  }

  onHabilitarEdicion() {
    this.isEditting = true;
    this.formGroup.enable();
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) { return; }
    this.selectedMotivo.nombre = this.nombreControl.value?.toUpperCase();
    this.selectedMotivo.descripcion = this.descripcionControl.value ? this.descripcionControl.value.toUpperCase() : null;
    this.selectedMotivo.activo = this.activoControl.value ?? true;
    this.selectedMotivo.usuario = this.mainService.usuarioActual;

    const aux = new MotivoVale();
    Object.assign(aux, this.selectedMotivo);

    this.motivoValeService.onSave(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
