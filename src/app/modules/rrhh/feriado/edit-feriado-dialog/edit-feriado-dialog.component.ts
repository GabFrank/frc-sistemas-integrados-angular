import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString, stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { Feriado } from '../feriado.model';
import { FeriadoService } from '../feriado.service';

export interface FeriadoDialogData {
  feriado: Feriado;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-feriado-dialog',
  templateUrl: './edit-feriado-dialog.component.html',
  styleUrls: ['./edit-feriado-dialog.component.scss']
})
export class EditFeriadoDialogComponent implements OnInit {

  selectedFeriado: Feriado;
  formGroup: FormGroup;
  isEditting = false;

  fechaControl = new FormControl(null, [Validators.required]);
  descripcionControl = new FormControl(null, [Validators.required]);
  esNacionalControl = new FormControl(true);
  recargoPorcentajeControl = new FormControl(100, [Validators.min(0)]);
  activoControl = new FormControl(true);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: FeriadoDialogData,
    private dialogRef: MatDialogRef<EditFeriadoDialogComponent>,
    private feriadoService: FeriadoService,
    private mainService: MainService
  ) {
    this.selectedFeriado = data?.feriado != null ? data.feriado : new Feriado();
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      fecha: this.fechaControl,
      descripcion: this.descripcionControl,
      esNacional: this.esNacionalControl,
      recargoPorcentaje: this.recargoPorcentajeControl,
      activo: this.activoControl
    });

    if (this.selectedFeriado.id) {
      this.cargarDatos();
    } else {
      this.isEditting = true;
    }
  }

  cargarDatos() {
    this.fechaControl.setValue(this.selectedFeriado.fecha ? stringToLocalDate(this.selectedFeriado.fecha) : null);
    this.descripcionControl.setValue(this.selectedFeriado.descripcion);
    this.esNacionalControl.setValue(this.selectedFeriado.esNacional ?? true);
    this.recargoPorcentajeControl.setValue(this.selectedFeriado.recargoPorcentaje ?? 100);
    this.activoControl.setValue(this.selectedFeriado.activo ?? true);
    this.formGroup.disable();
  }

  onHabilitarEdicion() {
    this.isEditting = true;
    this.formGroup.enable();
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) {
      return;
    }
    this.selectedFeriado.fecha = dateToString(this.fechaControl.value);
    this.selectedFeriado.descripcion = this.descripcionControl.value?.toUpperCase();
    this.selectedFeriado.esNacional = this.esNacionalControl.value ?? true;
    this.selectedFeriado.recargoPorcentaje = this.recargoPorcentajeControl.value ?? 100;
    this.selectedFeriado.activo = this.activoControl.value ?? true;
    this.selectedFeriado.usuario = this.mainService.usuarioActual;

    const aux = new Feriado();
    Object.assign(aux, this.selectedFeriado);

    this.feriadoService.onSave(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) {
          this.dialogRef.close(res);
        }
      });
  }
}
