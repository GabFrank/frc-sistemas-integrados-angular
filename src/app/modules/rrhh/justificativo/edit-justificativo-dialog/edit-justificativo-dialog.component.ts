import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { Justificativo, TipoJustificativo } from '../justificativo.model';
import { JustificativoService } from '../justificativo.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';


export interface JustificativoDialogData {
  funcionarioId: number;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-justificativo-dialog',
  templateUrl: './edit-justificativo-dialog.component.html',
  styleUrls: ['./edit-justificativo-dialog.component.scss']
})
export class EditJustificativoDialogComponent implements OnInit {

  formGroup: FormGroup;

  // los tipos vienen del catalogo (solo los cargables a mano: los generados por
  // el sistema — vacacion/feriado — los emite otro modulo)
  tipoOptions: TipoJustificativo[] = [];

  funcionarioControl = new FormControl(null, [Validators.required]);
  fechaControl = new FormControl(new Date(), [Validators.required]);
  tipoControl = new FormControl(null, [Validators.required]);
  observacionControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: JustificativoDialogData,
    private dialogRef: MatDialogRef<EditJustificativoDialogComponent>,
    private justificativoService: JustificativoService,
    private mainService: MainService
  ) {
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
    this.justificativoService.onGetTiposActivos().pipe(untilDestroyed(this))
      .subscribe((res: TipoJustificativo[]) => {
        // los generados por el sistema no se cargan a mano
        this.tipoOptions = (res || []).filter(t => !t.generadoPorSistema);
        const porDefecto = this.tipoOptions.find(t => (t.nombre || '').toUpperCase() === 'JUSTIFICADO');
        if (porDefecto) { this.tipoControl.setValue(porDefecto.id); }
      });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) {
      return;
    }
    const n = new Justificativo();
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    n.funcionario = func;
    n.fecha = dateToString(this.fechaControl.value);
    const tipo = new TipoJustificativo();
    tipo.id = this.tipoControl.value;
    n.tipo = tipo;
    n.observacion = this.observacionControl.value ? this.observacionControl.value.toUpperCase() : null;
    n.registradoPor = this.mainService.usuarioActual;

    this.justificativoService.onSave(n.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res != null) this.dialogRef.close(res);
      });
  }
}
