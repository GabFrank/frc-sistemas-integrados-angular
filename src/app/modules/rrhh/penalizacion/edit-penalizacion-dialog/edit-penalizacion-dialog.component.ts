import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { Penalizacion, PenalizacionTipo } from '../penalizacion.model';
import { PenalizacionService } from '../penalizacion.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';


export interface PenalizacionDialogData {
  funcionarioId: number;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-penalizacion-dialog',
  templateUrl: './edit-penalizacion-dialog.component.html',
  styleUrls: ['./edit-penalizacion-dialog.component.scss']
})
export class EditPenalizacionDialogComponent implements OnInit {

  formGroup: FormGroup;

  tipoOptions: PenalizacionTipo[] = [
    'TARDANZA', 'AUSENCIA', 'QUEJA_CLIENTE', 'AMBIENTE_LABORAL',
    'DANIO_MATERIAL', 'COMISION_DESCUENTO', 'OTRO'
  ];


  funcionarioControl = new FormControl(null, [Validators.required]);
  tipoControl = new FormControl('OTRO', [Validators.required]);
  fechaControl = new FormControl(new Date(), [Validators.required]);
  montoControl = new FormControl(0, [Validators.min(0)]);
  descripcionControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PenalizacionDialogData,
    private dialogRef: MatDialogRef<EditPenalizacionDialogComponent>,
    private penalizacionService: PenalizacionService,
    private mainService: MainService
  ) {
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      tipo: this.tipoControl,
      fecha: this.fechaControl,
      monto: this.montoControl,
      descripcion: this.descripcionControl
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
    const p = new Penalizacion();
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    p.funcionario = func;
    p.tipo = this.tipoControl.value as PenalizacionTipo;
    p.fecha = dateToString(this.fechaControl.value);
    p.monto = this.montoControl.value ?? 0;
    p.descripcion = this.descripcionControl.value ? this.descripcionControl.value.toUpperCase() : null;
    p.autoGenerada = false;
    p.anulada = false;
    p.registradoPor = this.mainService.usuarioActual;

    this.penalizacionService.onSave(p.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) this.dialogRef.close(res);
      });
  }
}
