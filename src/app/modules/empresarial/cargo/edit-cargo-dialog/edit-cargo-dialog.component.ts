import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { Cargo } from '../cargo.model';
import { CargoService } from '../cargo.service';

export interface CargoDialogData {
  cargo: Cargo;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-cargo-dialog',
  templateUrl: './edit-cargo-dialog.component.html',
  styleUrls: ['./edit-cargo-dialog.component.scss']
})
export class EditCargoDialogComponent implements OnInit {

  selectedCargo: Cargo;
  formGroup: FormGroup;
  isEditting = false;

  nombreControl = new FormControl(null, [Validators.required]);
  descripcionControl = new FormControl(null);
  sueldoBaseControl = new FormControl(null);
  supervisadoPorControl = new FormControl(null);

  /** Opciones de "depende de". Excluye el propio cargo: nadie se supervisa a si mismo. */
  cargosSupervisores: Cargo[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: CargoDialogData,
    private dialogRef: MatDialogRef<EditCargoDialogComponent>,
    private cargoService: CargoService,
    private mainService: MainService
  ) {
    this.selectedCargo = data?.cargo != null ? data.cargo : new Cargo();
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      nombre: this.nombreControl,
      descripcion: this.descripcionControl,
      sueldoBase: this.sueldoBaseControl,
      supervisadoPor: this.supervisadoPorControl
    });

    this.cargoService.onGetAll().pipe(untilDestroyed(this)).subscribe(res => {
      // No hay validacion de ciclos en el backend, asi que al menos no ofrecemos el
      // propio cargo como su supervisor.
      this.cargosSupervisores = (res || []).filter(c => c.id !== this.selectedCargo.id);
    });

    if (this.selectedCargo.id) {
      this.nombreControl.setValue(this.selectedCargo.nombre);
      this.descripcionControl.setValue(this.selectedCargo.descripcion);
      this.sueldoBaseControl.setValue(this.selectedCargo.sueldoBase);
      this.supervisadoPorControl.setValue(this.selectedCargo.supervisadoPor?.id);
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
    // Apollo congela los resultados: se clona antes de mutar.
    const aux = new Cargo();
    Object.assign(aux, this.selectedCargo);
    aux.nombre = this.nombreControl.value?.toUpperCase();
    aux.descripcion = this.descripcionControl.value ? this.descripcionControl.value.toUpperCase() : null;
    aux.sueldoBase = this.sueldoBaseControl.value;
    aux.supervisadoPor = this.supervisadoPorControl.value
      ? this.cargosSupervisores.find(c => c.id === this.supervisadoPorControl.value)
      : null;
    aux.usuario = this.mainService.usuarioActual;

    this.cargoService.onSave(aux.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
