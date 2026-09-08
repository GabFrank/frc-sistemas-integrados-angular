import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BonoTipo } from '../../bono/bono.model';
import { BonoRecurrente } from '../bono-recurrente.model';
import { BonoRecurrenteService } from '../bono-recurrente.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';

export interface BonoRecurrenteDialogData {
  funcionarioId: number;
  bonoRecurrente: BonoRecurrente;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-bono-recurrente-dialog',
  templateUrl: './edit-bono-recurrente-dialog.component.html',
  styleUrls: ['./edit-bono-recurrente-dialog.component.scss']
})
export class EditBonoRecurrenteDialogComponent implements OnInit {

  formGroup: FormGroup;

  tipoOptions: BonoTipo[] = ['CUMPLEANIOS', 'NAVIDAD', 'DESEMPENIO', 'PRODUCTIVIDAD', 'OTRO'];

  funcionarioControl = new FormControl(null, [Validators.required]);
  tipoControl = new FormControl('OTRO', [Validators.required]);
  montoControl = new FormControl(0, [Validators.required, Validators.min(1)]);
  motivoControl = new FormControl(null);
  activoControl = new FormControl(true);

  editandoId: number = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: BonoRecurrenteDialogData,
    private dialogRef: MatDialogRef<EditBonoRecurrenteDialogComponent>,
    private bonoRecurrenteService: BonoRecurrenteService
  ) { }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      tipo: this.tipoControl,
      monto: this.montoControl,
      motivo: this.motivoControl,
      activo: this.activoControl
    });
    const edit = this.data?.bonoRecurrente;
    if (edit != null) {
      this.editandoId = edit.id;
      this.funcionarioControl.setValue(edit.funcionario?.id);
      this.tipoControl.setValue(edit.tipo);
      this.montoControl.setValue(edit.monto);
      this.motivoControl.setValue(edit.motivo);
      this.activoControl.setValue(edit.activo);
    } else if (this.data?.funcionarioId != null) {
      this.funcionarioControl.setValue(this.data.funcionarioId);
    }
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) { return; }
    const b = new BonoRecurrente();
    b.id = this.editandoId;
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    b.funcionario = func;
    b.tipo = this.tipoControl.value as BonoTipo;
    b.monto = this.montoControl.value;
    b.motivo = this.motivoControl.value ? this.motivoControl.value.toUpperCase() : null;
    b.activo = this.activoControl.value ?? true;
    // El generador solo soporta MENSUAL; no se ofrece elegir para no volver a
    // prometer una recurrencia que no se aplica.
    b.frecuencia = 'MENSUAL';

    this.bonoRecurrenteService.onSave(b.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
