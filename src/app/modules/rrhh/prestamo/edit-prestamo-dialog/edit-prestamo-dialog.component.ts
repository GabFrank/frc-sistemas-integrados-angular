import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { Prestamo } from '../prestamo.model';
import { PrestamoService } from '../prestamo.service';
import { Funcionario } from '../../../personas/funcionarios/funcionario.model';

interface FuncionarioOpcion { id: number; label: string; }

export interface PrestamoDialogData {
  funcionarioOpciones: FuncionarioOpcion[];
  funcionarioId: number;
}

@UntilDestroy()
@Component({
  selector: 'app-edit-prestamo-dialog',
  templateUrl: './edit-prestamo-dialog.component.html',
  styleUrls: ['./edit-prestamo-dialog.component.scss']
})
export class EditPrestamoDialogComponent implements OnInit {

  formGroup: FormGroup;
  funcionarioOpciones: FuncionarioOpcion[] = [];
  monedas: Moneda[] = [];
  cajas: CajaVirtual[] = [];

  funcionarioControl = new FormControl(null, [Validators.required]);
  descripcionControl = new FormControl(null);
  montoTotalControl = new FormControl(0, [Validators.required, Validators.min(1)]);
  monedaControl = new FormControl(null, [Validators.required]);
  fechaInicioControl = new FormControl(new Date(), [Validators.required]);
  cantidadCuotasControl = new FormControl(1, [Validators.required, Validators.min(1)]);
  cajaControl = new FormControl(null, [Validators.required]);
  observacionControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: PrestamoDialogData,
    private dialogRef: MatDialogRef<EditPrestamoDialogComponent>,
    private prestamoService: PrestamoService,
    private monedaService: MonedaService,
    private cajaVirtualService: CajaVirtualService
  ) {
    this.funcionarioOpciones = data?.funcionarioOpciones || [];
  }

  ngOnInit(): void {
    this.formGroup = new FormGroup({
      funcionario: this.funcionarioControl,
      descripcion: this.descripcionControl,
      montoTotal: this.montoTotalControl,
      moneda: this.monedaControl,
      fechaInicio: this.fechaInicioControl,
      cantidadCuotas: this.cantidadCuotasControl,
      caja: this.cajaControl,
      observacion: this.observacionControl
    });
    if (this.data?.funcionarioId != null) {
      this.funcionarioControl.setValue(this.data.funcionarioId);
    }
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe((res: Moneda[]) => {
      this.monedas = res || [];
      const guarani = this.monedas.find(m => m.denominacion && m.denominacion.toUpperCase().includes('GUARANI'));
      if (guarani) this.monedaControl.setValue(guarani.id);
    });
    this.cajaVirtualService.onGetActivas().pipe(untilDestroyed(this)).subscribe((res: CajaVirtual[]) => {
      this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR');
    });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }

  onGuardar() {
    if (this.formGroup.invalid) { return; }
    const p = new Prestamo();
    const func = new Funcionario();
    func.id = this.funcionarioControl.value;
    p.funcionario = func;
    p.descripcion = this.descripcionControl.value ? this.descripcionControl.value.toUpperCase() : null;
    p.montoTotal = this.montoTotalControl.value;
    const mon = new Moneda();
    mon.id = this.monedaControl.value;
    p.moneda = mon;
    p.fechaInicio = dateToString(this.fechaInicioControl.value);
    p.cantidadCuotas = this.cantidadCuotasControl.value;
    p.observacion = this.observacionControl.value ? this.observacionControl.value.toUpperCase() : null;

    this.prestamoService.onCrear(p.toInput(), this.cajaControl.value)
      .pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }
}
