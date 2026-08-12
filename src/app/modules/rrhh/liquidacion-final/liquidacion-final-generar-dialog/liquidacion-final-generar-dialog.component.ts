import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString, stringToLocalDate } from '../../../../commons/core/utils/dateUtils';
import { CurrencyMask } from '../../../../commons/core/utils/numbersUtils';
import { MotivoEgreso } from '../liquidacion-final.model';
import { LiquidacionFinalService } from '../liquidacion-final.service';

export interface LiquidacionFinalGenerarDialogData {
  funcionarioId: number;
  nombre?: string;
  monedaId?: number;
  // Prefill (al regenerar desde la tab):
  motivo?: string;
  fecha?: any;
  preavisoOtorgado?: boolean;
  salarioBase?: number;
  diasVacaciones?: number;
}

/**
 * Diálogo de parámetros del finiquito antes de generar. Precarga los valores
 * auto-calculados (preview) y deja editar TODO antes de generar: fecha ingreso/egreso,
 * salario base, preaviso (otorgado + días), vacaciones, aguinaldo, base de IPS, y qué
 * obligaciones cobrar (vales/convenios/préstamos/penalizaciones). Genera el borrador y
 * cierra devolviéndolo; el legajo/tab abre el detalle editable.
 */
@UntilDestroy()
@Component({
  selector: 'app-liquidacion-final-generar-dialog',
  templateUrl: './liquidacion-final-generar-dialog.component.html',
  styleUrls: ['./liquidacion-final-generar-dialog.component.scss']
})
export class LiquidacionFinalGenerarDialogComponent implements OnInit {

  motivos: MotivoEgreso[] = ['RENUNCIA', 'DESPIDO_JUSTIFICADO', 'DESPIDO_INJUSTIFICADO', 'MUTUO_ACUERDO', 'JUBILACION', 'FALLECIMIENTO', 'OTRO'];

  motivoControl = new FormControl('DESPIDO_INJUSTIFICADO');
  fechaEgresoControl = new FormControl(new Date());
  fechaIngresoControl = new FormControl(null);
  salarioBaseControl = new FormControl(null);
  diasTrabajadosMesControl = new FormControl(null);
  preavisoOtorgadoControl = new FormControl(false);
  preavisoDiasControl = new FormControl(null);
  diasVacacionesControl = new FormControl(null);
  aguinaldoControl = new FormControl(null);
  ipsBaseControl = new FormControl(null);
  descontarIpsControl = new FormControl(true);
  cobrarValesControl = new FormControl(true);
  cobrarConveniosControl = new FormControl(true);
  cobrarPrestamosControl = new FormControl(true);
  descontarPenalizacionesControl = new FormControl(true);

  antiguedadTexto = '';
  cargandoPreview = false;
  generando = false;
  currencyMask = new CurrencyMask();   // formato Gs: sin decimales, miles con "."

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LiquidacionFinalGenerarDialogData,
    private dialogRef: MatDialogRef<LiquidacionFinalGenerarDialogComponent>,
    private service: LiquidacionFinalService
  ) {
    if (data?.motivo != null) { this.motivoControl.setValue(data.motivo); }
    if (data?.fecha != null) { this.fechaEgresoControl.setValue(new Date(data.fecha)); }
    if (data?.preavisoOtorgado != null) { this.preavisoOtorgadoControl.setValue(data.preavisoOtorgado); }
  }

  ngOnInit(): void {
    this.cargarPreview(true);
  }

  /** Trae los valores auto y precarga los campos. aplicaPrefill=true respeta los
   *  valores del prefill (regenerar) por sobre el preview. */
  private cargarPreview(aplicaPrefill: boolean) {
    this.cargandoPreview = true;
    const fecha = dateToString(this.fechaEgresoControl.value);
    this.service.onPreview(this.data.funcionarioId, fecha).pipe(untilDestroyed(this)).subscribe((p: any) => {
      this.cargandoPreview = false;
      if (p == null) { return; }
      this.antiguedadTexto = (p.antiguedadAnios || 0) + ' años (' + (p.antiguedadDias || 0) + ' días)';
      this.fechaIngresoControl.setValue(p.fechaIngreso ? stringToLocalDate(p.fechaIngreso) : null);
      this.salarioBaseControl.setValue(p.salarioPromedio);
      this.diasTrabajadosMesControl.setValue(p.diasTrabajadosMes);
      this.diasVacacionesControl.setValue(p.diasVacacionesNoGozadas);
      this.aguinaldoControl.setValue(p.aguinaldoProporcional);
      this.preavisoDiasControl.setValue(p.preavisoDias);
      this.ipsBaseControl.setValue(p.ipsBase);
      // Descontar IPS por defecto según ipsActivo del funcionario (null/true = sí).
      this.descontarIpsControl.setValue(p.ipsActivo !== false);
      if (aplicaPrefill) {
        if (this.data?.salarioBase != null) { this.salarioBaseControl.setValue(this.data.salarioBase); }
        if (this.data?.diasVacaciones != null) { this.diasVacacionesControl.setValue(this.data.diasVacaciones); }
      }
    });
  }

  /** Al cambiar la fecha de egreso se recalculan los defaults derivados (antigüedad,
   *  aguinaldo, preaviso). */
  onFechaEgresoChange() {
    this.cargarPreview(false);
  }

  private num(control: FormControl): number {
    const v = control.value;
    return v != null && v !== '' ? Number(v) : null;
  }

  onGenerar() {
    this.generando = true;
    const input = {
      funcionarioId: this.data.funcionarioId,
      motivoEgreso: this.motivoControl.value,
      fechaEgreso: dateToString(this.fechaEgresoControl.value),
      monedaId: this.data.monedaId,
      fechaIngreso: this.fechaIngresoControl.value ? dateToString(this.fechaIngresoControl.value) : null,
      salarioBase: this.num(this.salarioBaseControl),
      diasTrabajadosMes: this.num(this.diasTrabajadosMesControl),
      preavisoOtorgado: this.preavisoOtorgadoControl.value,
      preavisoDias: this.num(this.preavisoDiasControl),
      diasVacaciones: this.num(this.diasVacacionesControl),
      aguinaldo: this.num(this.aguinaldoControl),
      ipsBase: this.num(this.ipsBaseControl),
      descontarIps: this.descontarIpsControl.value,
      cobrarVales: this.cobrarValesControl.value,
      cobrarConvenios: this.cobrarConveniosControl.value,
      cobrarPrestamos: this.cobrarPrestamosControl.value,
      descontarPenalizaciones: this.descontarPenalizacionesControl.value
    };
    this.service.onGenerar(input).pipe(untilDestroyed(this)).subscribe(res => {
      this.generando = false;
      if (res != null) { this.dialogRef.close(res); }
    });
  }

  onCancelar() { this.dialogRef.close(); }
}
