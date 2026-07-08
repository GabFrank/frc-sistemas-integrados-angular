import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { Bono, BonoTipo, BonoFrecuencia } from '../bono.model';
import { BonoService } from '../bono.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';

interface FuncionarioOpcion { id: number; label: string; }

export interface BonoDialogData {
  funcionarioOpciones: FuncionarioOpcion[];
  funcionarioId: number;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-bono-dialog',
  templateUrl: './edit-bono-dialog.component.html',
  styleUrls: ['./edit-bono-dialog.component.scss']
})
export class EditBonoDialogComponent implements OnInit {

  formGroup: FormGroup;
  funcionarioOpciones: FuncionarioOpcion[] = [];

  tipoOptions: BonoTipo[] = ['CUMPLEANIOS', 'NAVIDAD', 'DESEMPENIO', 'PRODUCTIVIDAD', 'OTRO'];
  frecuenciaOptions: BonoFrecuencia[] = ['SEMANAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'];

  funcionarioControl = new FormControl(null, [Validators.required]);
  tipoControl = new FormControl('OTRO', [Validators.required]);
  montoControl = new FormControl(0, [Validators.required, Validators.min(1)]);
  fechaControl = new FormControl(new Date(), [Validators.required]);
  motivoControl = new FormControl(null);
  esRecurrenteControl = new FormControl(false);
  frecuenciaControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: BonoDialogData,
    private dialogRef: MatDialogRef<EditBonoDialogComponent>,
    private bonoService: BonoService,
    private mainService: MainService
  ) {
    this.funcionarioOpciones = data?.funcionarioOpciones || [];
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      tipo: this.tipoControl,
      monto: this.montoControl,
      fecha: this.fechaControl,
      motivo: this.motivoControl,
      esRecurrente: this.esRecurrenteControl,
      frecuencia: this.frecuenciaControl
    });
    if (this.data?.funcionarioId != null) {
      this.funcionarioControl.setValue(this.data.funcionarioId);
    }
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) { return; }
    const b = new Bono();
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    b.funcionario = func;
    b.tipo = this.tipoControl.value as BonoTipo;
    b.monto = this.montoControl.value;
    b.fecha = dateToString(this.fechaControl.value);
    b.motivo = this.motivoControl.value ? this.motivoControl.value.toUpperCase() : null;
    b.esRecurrente = this.esRecurrenteControl.value ?? false;
    b.frecuencia = this.esRecurrenteControl.value ? (this.frecuenciaControl.value as BonoFrecuencia) : null;

    this.bonoService.onSave(b.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
