import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { HoraExtra, HoraExtraTipo } from '../hora-extra.model';
import { HoraExtraService } from '../hora-extra.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';


export interface HoraExtraDialogData {
  funcionarioId: number;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-hora-extra-dialog',
  templateUrl: './edit-hora-extra-dialog.component.html',
  styleUrls: ['./edit-hora-extra-dialog.component.scss']
})
export class EditHoraExtraDialogComponent implements OnInit {

  formGroup: FormGroup;

  tipoOptions: HoraExtraTipo[] = ['DIURNA', 'NOCTURNA', 'FERIADO'];

  funcionarioControl = new FormControl(null, [Validators.required]);
  fechaControl = new FormControl(new Date(), [Validators.required]);
  tipoControl = new FormControl('DIURNA', [Validators.required]);
  minutosControl = new FormControl(0, [Validators.min(0)]);
  recargoPorcentajeControl = new FormControl(50, [Validators.min(0)]);
  montoCalculadoControl = new FormControl(0, [Validators.min(0)]);
  observacionControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: HoraExtraDialogData,
    private dialogRef: MatDialogRef<EditHoraExtraDialogComponent>,
    private horaExtraService: HoraExtraService,
    private mainService: MainService
  ) {
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      fecha: this.fechaControl,
      tipo: this.tipoControl,
      minutos: this.minutosControl,
      recargoPorcentaje: this.recargoPorcentajeControl,
      montoCalculado: this.montoCalculadoControl,
      observacion: this.observacionControl
    });
    if (this.data?.funcionarioId != null) {
      this.funcionarioControl.setValue(this.data.funcionarioId);
    }
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) {
      return;
    }
    const he = new HoraExtra();
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    he.funcionario = func;
    he.fecha = dateToString(this.fechaControl.value);
    he.tipo = this.tipoControl.value as HoraExtraTipo;
    he.minutos = this.minutosControl.value ?? 0;
    he.recargoPorcentaje = this.recargoPorcentajeControl.value ?? 0;
    he.montoCalculado = this.montoCalculadoControl.value ?? 0;
    he.origen = 'MANUAL';
    he.anulada = false;
    he.autorizadoPor = this.mainService.usuarioActual;
    he.observacion = this.observacionControl.value ? this.observacionControl.value.toUpperCase() : null;

    this.horaExtraService.onSave(he.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) this.dialogRef.close(res);
      });
  }
}
