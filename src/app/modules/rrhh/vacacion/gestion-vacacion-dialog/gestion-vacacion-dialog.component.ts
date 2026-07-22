import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { Vacacion, VacacionPeriodo, VacacionVenta } from '../vacacion.model';
import { VacacionService } from '../vacacion.service';

export interface GestionVacacionDialogData {
  vacacion: Vacacion;
}

@UntilDestroy()
@Component({
  selector: 'app-gestion-vacacion-dialog',
  templateUrl: './gestion-vacacion-dialog.component.html',
  styleUrls: ['./gestion-vacacion-dialog.component.scss']
})
export class GestionVacacionDialogComponent implements OnInit {

  vacacion: Vacacion;
  disponibles = 0;

  periodosColumns = ['fechaDesde', 'fechaHasta', 'diasUsados', 'estado', 'acciones'];
  ventasColumns = ['dias', 'monto', 'fecha', 'estado'];
  periodos = new MatTableDataSource<VacacionPeriodo>([]);
  ventas = new MatTableDataSource<VacacionVenta>([]);

  desdeControl = new FormControl(null, [Validators.required]);
  hastaControl = new FormControl(null, [Validators.required]);
  diasVentaControl = new FormControl(1, [Validators.min(1)]);

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: GestionVacacionDialogData,
    private dialogRef: MatDialogRef<GestionVacacionDialogComponent>,
    private vacacionService: VacacionService,
    private mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) {
    this.vacacion = data.vacacion;
    this.disponibles = (this.vacacion.diasGenerados || 0) - (this.vacacion.diasGozados || 0);
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.vacacionService.onGetPeriodos(this.vacacion.id)
      .pipe(untilDestroyed(this)).subscribe(res => { this.periodos.data = res || []; });
    this.vacacionService.onGetVentas(this.vacacion.id)
      .pipe(untilDestroyed(this)).subscribe(res => { this.ventas.data = res || []; });
  }

  /**
   * Crea el periodo como SOLICITADA. Antes mandaba PROGRAMADA directo, lo que
   * saltaba la aprobacion: el boton de aprobar (visible solo en SOLICITADA) quedaba
   * inalcanzable y el periodo nunca registraba quien lo autorizo — aunque mobile si
   * implementa la aprobacion por supervisor.
   */
  onSolicitar() {
    if (this.desdeControl.invalid || this.hastaControl.invalid) { return; }
    this.vacacionService.onProgramarPeriodo(
      this.vacacion.id,
      dateToString(this.desdeControl.value),
      dateToString(this.hastaControl.value),
      'SOLICITADA',
      null
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res != null) { this.desdeControl.reset(); this.hastaControl.reset(); this.cargar(); }
    });
  }

  onAprobar(p: VacacionPeriodo) {
    this.vacacionService.onAprobarPeriodo(p.id, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.cargar(); });
  }

  onMarcarGozada(p: VacacionPeriodo) {
    this.vacacionService.onMarcarGozada(p.id)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.cargar(); });
  }

  onVenderDias() {
    const dias = this.diasVentaControl.value;
    if (!dias || dias < 1) { return; }
    if (dias > this.disponibles) {
      this.notificacion.notification$.next({ texto: 'No hay suficientes días disponibles', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.vacacionService.onVenderDias(this.vacacion.id, dias, null)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.cargar(); });
  }

  onCerrar() {
    this.dialogRef.close(true);
  }
}
