import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { merge } from 'rxjs';
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

/** Fila de la vista previa: cuándo se descuenta cada cuota. */
export interface CuotaPreview {
  numero: number;
  monto: number;
  fecha: Date;
}

export const MAX_CUOTAS_VALE = 12;

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
  // Por defecto true: lo normal es que un vale sea adelanto de sueldo y se
  // descuente en la liquidacion. Los que no lo son son la excepcion.
  esAdelantoControl = new FormControl(true);
  observacionControl = new FormControl(null);
  cuotasControl = new FormControl(1, [Validators.required, Validators.min(1), Validators.max(MAX_CUOTAS_VALE)]);
  // Entregado en bienes: nace confirmado sin caja. Solo RRHH APROBAR (el backend lo exige).
  enEspecieControl = new FormControl(false);

  puedeAprobar = false;
  cuotasPreview: CuotaPreview[] = [];
  maxCuotas = MAX_CUOTAS_VALE;

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
      observacion: this.observacionControl,
      cuotas: this.cuotasControl,
      enEspecie: this.enEspecieControl
    });
    this.puedeAprobar = this.mainService.tieneAlgunRol(['RRHH APROBAR']);
    merge(this.montoControl.valueChanges, this.cuotasControl.valueChanges, this.fechaControl.valueChanges)
      .pipe(untilDestroyed(this))
      .subscribe(() => this.actualizarPreview());
    // Un uniforme o una herramienta no son adelanto de sueldo.
    this.enEspecieControl.valueChanges.pipe(untilDestroyed(this)).subscribe(v => {
      if (v) this.esAdelantoControl.setValue(false);
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

  /**
   * Mismo cálculo que el backend: montos enteros si el monto lo es, la última cuota absorbe el
   * redondeo, y la cuota k se descuenta en la liquidación que cubra fecha + (k-1) meses. Se muestra
   * la fecha y no el mes porque con día de cierre < 28 el periodo no es el mes calendario.
   */
  private actualizarPreview() {
    const n = +this.cuotasControl.value || 1;
    const monto = +this.montoControl.value || 0;
    const fecha: Date = this.fechaControl.value ? new Date(this.fechaControl.value) : null;
    if (n <= 1 || n > MAX_CUOTAS_VALE || monto <= 0 || fecha == null) {
      this.cuotasPreview = [];
      return;
    }
    const decimales = Number.isInteger(monto) ? 0 : 2;
    const factor = Math.pow(10, decimales);
    const base = Math.round((monto / n) * factor) / factor;
    const preview: CuotaPreview[] = [];
    let acumulado = 0;
    for (let i = 1; i <= n; i++) {
      const m = i === n ? Math.round((monto - acumulado) * factor) / factor : base;
      acumulado += m;
      preview.push({ numero: i, monto: m, fecha: this.sumarMeses(fecha, i - 1) });
    }
    this.cuotasPreview = preview;
  }

  /** Como LocalDate.plusMonths: el 31/01 + 1 mes es el 28/02, no el 03/03. */
  private sumarMeses(fecha: Date, meses: number): Date {
    const destino = new Date(fecha.getFullYear(), fecha.getMonth() + meses, 1);
    const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
    destino.setDate(Math.min(fecha.getDate(), ultimoDia));
    return destino;
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
    v.cantidadCuotas = +this.cuotasControl.value || 1;

    const guardar$ = this.puedeAprobar && this.enEspecieControl.value
      ? this.valeService.onCrearEnEspecie(v.toInput(), this.mainService.usuarioActual?.id)
      : this.valeService.onSave(v.toInput());
    // El aviso de error (negocio o red) ya lo muestra GenericCrudService.
    guardar$.pipe(untilDestroyed(this))
      .subscribe({ next: res => { if (res != null) this.dialogRef.close(res); }, error: () => {} });
  }
}
