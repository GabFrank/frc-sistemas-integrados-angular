import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { LiquidacionFinal, MotivoEgreso } from '../liquidacion-final.model';
import { LiquidacionFinalService } from '../liquidacion-final.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface LiquidacionFinalDialogData { funcionarioId: number; nombre?: string; monedaId?: number; }

@UntilDestroy()
@Component({
  selector: 'app-liquidacion-final-dialog',
  templateUrl: './liquidacion-final-dialog.component.html',
  styleUrls: ['./liquidacion-final-dialog.component.scss']
})
export class LiquidacionFinalDialogComponent implements OnInit {

  liq: LiquidacionFinal = null;
  cambiado = false;

  motivos: MotivoEgreso[] = ['RENUNCIA', 'DESPIDO_JUSTIFICADO', 'DESPIDO_INJUSTIFICADO', 'MUTUO_ACUERDO', 'JUBILACION', 'FALLECIMIENTO', 'OTRO'];
  motivoControl = new FormControl('DESPIDO_INJUSTIFICADO');
  fechaControl = new FormControl(new Date());

  cajas: CajaVirtual[] = [];
  cajaControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: LiquidacionFinalDialogData,
    private dialogRef: MatDialogRef<LiquidacionFinalDialogComponent>,
    private liquidacionFinalService: LiquidacionFinalService,
    private cajaVirtualService: CajaVirtualService,
    private dialogosService: DialogosService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.cargarExistente();
    this.cajaVirtualService.onGetActivas().pipe(untilDestroyed(this))
      .subscribe((res: CajaVirtual[]) => { this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR'); });
  }

  cargarExistente() {
    this.liquidacionFinalService.onGetPorFuncionario(this.data.funcionarioId).pipe(untilDestroyed(this))
      .subscribe((res: LiquidacionFinal[]) => {
        const vigente = (res || []).find(l => l.estado !== 'ANULADA');
        if (vigente) { this.liq = vigente; }
      });
  }

  private aplicar(res: any) {
    if (res != null) { this.liq = res; this.cambiado = true; }
  }

  onGenerar() {
    this.liquidacionFinalService.onGenerar(
      this.data.funcionarioId,
      this.motivoControl.value,
      dateToString(this.fechaControl.value),
      this.data.monedaId
    ).pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
  }

  onAprobar() {
    this.liquidacionFinalService.onAprobar(this.liq.id, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
  }

  onVolverBorrador() {
    this.liquidacionFinalService.onVolverBorrador(this.liq.id)
      .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
  }

  onPagar() {
    if (this.cajaControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione la Caja Mayor', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.dialogosService.confirm(
      'Pagar liquidación final',
      '¿Pagar el finiquito de ' + (this.liq.totalLiquidado || 0) + ' desde la Caja Mayor? El funcionario quedará inactivo.',
      null, null, true, 'Sí', null, 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionFinalService.onPagar(this.liq.id, this.cajaControl.value)
          .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
      }
    });
  }

  onAnular() {
    this.dialogosService.confirm(
      'Anular liquidación final',
      '¿Anular este finiquito pagado? Se generará el contra-asiento en la caja.',
      null, null, true, 'Sí', null, 'No'
    ).pipe(untilDestroyed(this)).subscribe(r => {
      if (r === true) {
        this.liquidacionFinalService.onAnular(this.liq.id)
          .pipe(untilDestroyed(this)).subscribe(res => this.aplicar(res));
      }
    });
  }

  onCerrar() { this.dialogRef.close(this.cambiado); }
}
