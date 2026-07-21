import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';
import { MotivoVale } from '../../motivo-vale/motivo-vale.model';
import { MotivoValeService } from '../../motivo-vale/motivo-vale.service';
import { Vale } from '../vale.model';
import { ValeService } from '../vale.service';


export interface ValeDialogData {
  funcionarioId: number;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-vale-dialog',
  templateUrl: './edit-vale-dialog.component.html',
  styleUrls: ['./edit-vale-dialog.component.scss']
})
export class EditValeDialogComponent implements OnInit {

  formGroup: FormGroup;
  motivos: MotivoVale[] = [];
  monedas: Moneda[] = [];

  funcionarioControl = new FormControl(null, [Validators.required]);
  motivoControl = new FormControl(null);
  montoControl = new FormControl(0, [Validators.required, Validators.min(1)]);
  monedaControl = new FormControl(null, [Validators.required]);
  fechaControl = new FormControl(new Date(), [Validators.required]);
  esAdelantoControl = new FormControl(false);
  observacionControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ValeDialogData,
    private dialogRef: MatDialogRef<EditValeDialogComponent>,
    private valeService: ValeService,
    private motivoValeService: MotivoValeService,
    private monedaService: MonedaService,
    private mainService: MainService
  ) {
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      motivo: this.motivoControl,
      monto: this.montoControl,
      moneda: this.monedaControl,
      fecha: this.fechaControl,
      esAdelanto: this.esAdelantoControl,
      observacion: this.observacionControl
    });
    if (this.data?.funcionarioId != null) {
      this.funcionarioControl.setValue(this.data.funcionarioId);
    }
    this.motivoValeService.onGetAll().pipe(untilDestroyed(this)).subscribe((res: MotivoVale[]) => {
      this.motivos = (res || []).filter(m => m.activo);
    });
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe((res: Moneda[]) => {
      this.monedas = res || [];
      const guarani = this.monedas.find(m => m.denominacion && m.denominacion.toUpperCase().includes('GUARANI'));
      if (guarani) this.monedaControl.setValue(guarani.id);
    });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) { return; }
    const v = new Vale();
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    v.funcionario = func;
    if (this.motivoControl.value != null) {
      const m = new MotivoVale();
      m.id = this.motivoControl.value;
      v.motivo = m;
    }
    v.monto = this.montoControl.value;
    const mon = new Moneda();
    mon.id = this.monedaControl.value;
    v.moneda = mon;
    v.fecha = dateToString(this.fechaControl.value);
    v.estado = 'SOLICITADO';
    v.esAdelanto = this.esAdelantoControl.value ?? false;
    v.observacion = this.observacionControl.value ? this.observacionControl.value.toUpperCase() : null;
    v.usuario = this.mainService.usuarioActual;

    this.valeService.onSave(v.toInput())
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
