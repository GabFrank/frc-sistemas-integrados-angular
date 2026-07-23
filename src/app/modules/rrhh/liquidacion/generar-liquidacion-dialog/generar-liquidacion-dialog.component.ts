import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { LiquidacionService } from '../liquidacion.service';


export interface GenerarLiquidacionDialogData {
  funcionarioId?: number;
  periodo?: string;
}

interface FuncionarioElegido {
  id: number;
  label: string;
}

/**
 * Configura la generación de liquidaciones antes de dispararla.
 *
 * Reemplaza los dos botones sueltos anteriores ("+ Adicionar" = uno, "Generar mes"
 * = todos sin confirmación, disparando cientos de un click). Ahora un solo flujo
 * elige período, alcance (todos / algunos funcionarios) y moneda.
 */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-generar-liquidacion-dialog',
  templateUrl: './generar-liquidacion-dialog.component.html',
  styleUrls: ['./generar-liquidacion-dialog.component.scss']
})
export class GenerarLiquidacionDialogComponent implements OnInit {

  monedas: Moneda[] = [];

  periodoControl = new FormControl(null, [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]);
  monedaControl = new FormControl(null);

  /** 'TODOS' corre para todos los activos; 'ALGUNOS' solo para los elegidos. */
  alcanceControl = new FormControl('TODOS');

  funcionarioSeleccionadoId: number = null;
  elegidos: FuncionarioElegido[] = [];

  generando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: GenerarLiquidacionDialogData,
    private dialogRef: MatDialogRef<GenerarLiquidacionDialogComponent>,
    private liquidacionService: LiquidacionService,
    private monedaService: MonedaService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    if (this.data?.periodo) {
      this.periodoControl.setValue(this.data.periodo);
    } else {
      const hoy = new Date();
      this.periodoControl.setValue(hoy.getFullYear() + '-' + ('0' + (hoy.getMonth() + 1)).slice(-2));
    }
    // Si el diálogo se abrió desde una fila puntual, arranca acotado a ese funcionario.
    if (this.data?.funcionarioId != null) {
      this.alcanceControl.setValue('ALGUNOS');
      this.funcionarioSeleccionadoId = this.data.funcionarioId;
    }
    this.monedaService.onGetAll().pipe(untilDestroyed(this)).subscribe((res: Moneda[]) => {
      this.monedas = res || [];
      const g = this.monedas.find(m => m.denominacion && m.denominacion.toUpperCase().includes('GUARANI'));
      if (g) { this.monedaControl.setValue(g.id); }
    });
  }

  onAgregarFuncionario(f: any) {
    if (f == null) { return; }
    if (this.elegidos.some(x => x.id === f.id)) { return; }
    const nombre = f.persona != null && f.persona.nombre != null ? f.persona.nombre : ('#' + f.id);
    this.elegidos = this.elegidos.concat([{ id: f.id, label: f.id + ' - ' + nombre }]);
    this.funcionarioSeleccionadoId = null;
  }

  onQuitar(id: number) {
    this.elegidos = this.elegidos.filter(x => x.id !== id);
  }

  onGenerar() {
    if (this.periodoControl.invalid) {
      this.notificacion.notification$.next({
        texto: 'Indique el período con formato YYYY-MM', color: NotificacionColor.warn, duracion: 3
      });
      return;
    }
    const todos = this.alcanceControl.value === 'TODOS';
    if (!todos && this.elegidos.length === 0) {
      this.notificacion.notification$.next({
        texto: 'Agregue al menos un funcionario o elija "Todos los activos"',
        color: NotificacionColor.warn, duracion: 3
      });
      return;
    }
    const ids = todos ? null : this.elegidos.map(x => x.id);
    this.generando = true;
    this.liquidacionService.onGenerarLote(ids, this.periodoControl.value, this.monedaControl.value)
      .pipe(untilDestroyed(this))
      .subscribe((cant: number) => {
        this.generando = false;
        this.notificacion.notification$.next({
          texto: 'Borradores generados: ' + (cant ?? 0),
          color: NotificacionColor.success, duracion: 4
        });
        this.dialogRef.close(cant ?? 0);
      });
  }

  onCancelar() {
    this.dialogRef.close(null);
  }
}
