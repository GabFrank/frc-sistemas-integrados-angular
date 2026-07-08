import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { JornadaNovedad, JornadaNovedadTipo } from '../jornada-novedad.model';
import { JornadaNovedadService } from '../jornada-novedad.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';

interface FuncionarioOpcion {
  id: number;
  label: string;
}

export interface NovedadDialogData {
  funcionarioOpciones: FuncionarioOpcion[];
  funcionarioId: number;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-jornada-novedad-dialog',
  templateUrl: './edit-jornada-novedad-dialog.component.html',
  styleUrls: ['./edit-jornada-novedad-dialog.component.scss']
})
export class EditJornadaNovedadDialogComponent implements OnInit {

  formGroup: FormGroup;

  tipoOptions: JornadaNovedadTipo[] = [
    'VACACION', 'JUSTIFICADO', 'FERIADO', 'AUSENCIA_JUSTIFICADA', 'MEDIA_FALTA'
  ];
  funcionarioOpciones: FuncionarioOpcion[] = [];

  funcionarioControl = new FormControl(null, [Validators.required]);
  fechaControl = new FormControl(new Date(), [Validators.required]);
  tipoControl = new FormControl('JUSTIFICADO', [Validators.required]);
  observacionControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: NovedadDialogData,
    private dialogRef: MatDialogRef<EditJornadaNovedadDialogComponent>,
    private novedadService: JornadaNovedadService,
    private mainService: MainService
  ) {
    this.funcionarioOpciones = data?.funcionarioOpciones || [];
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      fecha: this.fechaControl,
      tipo: this.tipoControl,
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
    const n = new JornadaNovedad();
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    n.funcionario = func;
    n.fecha = dateToString(this.fechaControl.value);
    n.tipo = this.tipoControl.value as JornadaNovedadTipo;
    n.observacion = this.observacionControl.value ? this.observacionControl.value.toUpperCase() : null;
    n.registradoPor = this.mainService.usuarioActual;

    this.novedadService.onSave(n.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) this.dialogRef.close(res);
      });
  }
}
