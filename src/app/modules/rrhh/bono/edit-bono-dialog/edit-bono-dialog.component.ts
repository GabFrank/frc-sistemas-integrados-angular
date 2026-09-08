import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString, stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { Bono, BonoTipo, BonoFrecuencia } from '../bono.model';
import { BonoService } from '../bono.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';


export interface BonoDialogData {
  funcionarioId: number;
  bono: Bono;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-bono-dialog',
  templateUrl: './edit-bono-dialog.component.html',
  styleUrls: ['./edit-bono-dialog.component.scss']
})
export class EditBonoDialogComponent implements OnInit {

  formGroup: FormGroup;

  tipoOptions: BonoTipo[] = ['CUMPLEANIOS', 'NAVIDAD', 'DESEMPENIO', 'PRODUCTIVIDAD', 'OTRO'];

  // Solo MENSUAL: es la unica frecuencia que el generador implementa. Ofrecer las
  // otras cuatro del enum repetiria la promesa vacia que esta pantalla vino a sacar.
  frecuenciaOptions: BonoFrecuencia[] = ['MENSUAL'];

  funcionarioControl = new FormControl(null, [Validators.required]);
  tipoControl = new FormControl('OTRO', [Validators.required]);
  montoControl = new FormControl(0, [Validators.required, Validators.min(1)]);
  fechaControl = new FormControl(new Date(), [Validators.required]);
  motivoControl = new FormControl(null);
  esRecurrenteControl = new FormControl(false);
  frecuenciaControl = new FormControl('MENSUAL');

  editandoId: number = null;
  soloLectura = false;
  motivoNoEditable: string = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: BonoDialogData,
    private dialogRef: MatDialogRef<EditBonoDialogComponent>,
    private bonoService: BonoService,
    private mainService: MainService
  ) {
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
    const edit = this.data?.bono;
    if (edit != null) {
      this.editandoId = edit.id;
      this.funcionarioControl.setValue(edit.funcionario?.id);
      this.tipoControl.setValue(edit.tipo);
      this.montoControl.setValue(edit.monto);
      // stringToLocalDate y no new Date(): 'yyyy-MM-dd' se parsea como medianoche
      // UTC y en UTC-3 retrocede un dia. En un bono generado (fecha = dia 1) eso
      // lo movia al mes anterior y la guarda de periodo rechazaba la edicion.
      this.fechaControl.setValue(edit.fecha ? stringToLocalDate(edit.fecha) : new Date());
      this.motivoControl.setValue(edit.motivo);
      this.esRecurrenteControl.setValue(edit.esRecurrente ?? false);
      this.frecuenciaControl.setValue(edit.frecuencia ?? 'MENSUAL');
      // El backend es dueño de la decision de editabilidad (liquidado, planilla
      // aprobada, periodo pasado). Explicito === false: undefined no debe bloquear.
      if (edit.editable === false) {
        this.soloLectura = true;
        this.motivoNoEditable = edit.motivoNoEditable;
        this.formGroup.disable();
      }
    } else if (this.data?.funcionarioId != null) {
      this.funcionarioControl.setValue(this.data.funcionarioId);
    }
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid || this.soloLectura) { return; }
    const b = new Bono();
    b.id = this.editandoId;
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    b.funcionario = func;
    b.tipo = this.tipoControl.value as BonoTipo;
    b.monto = this.montoControl.value;
    b.fecha = dateToString(this.fechaControl.value);
    b.motivo = this.motivoControl.value ? this.motivoControl.value.toUpperCase() : null;
    b.esRecurrente = this.esRecurrenteControl.value ?? false;
    b.frecuencia = this.esRecurrenteControl.value
      ? (this.frecuenciaControl.value as BonoFrecuencia) : null;

    this.bonoService.onSave(b.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
