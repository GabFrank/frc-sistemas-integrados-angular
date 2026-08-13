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
  ventasColumns = ['dias', 'monto', 'fecha', 'estado', 'acciones'];
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

  puedeAprobar = false;

  ngOnInit(): void {
    this.puedeAprobar = this.mainService.tieneAlgunRol(['RRHH APROBAR']);
    this.cargar();
  }

  cargar() {
    this.vacacionService.onGetPeriodos(this.vacacion.id)
      .pipe(untilDestroyed(this)).subscribe(res => {
        this.periodos.data = res || [];
        this.recalcularDisponibles();
      });
    this.vacacionService.onGetVentas(this.vacacion.id)
      .pipe(untilDestroyed(this)).subscribe(res => {
        this.ventas.data = res || [];
        this.recalcularDisponibles();
      });
  }

  /**
   * Recalcula el saldo tras cada accion. Antes se computaba una sola vez al abrir el
   * dialogo, asi que al marcar un periodo como gozado los dias disponibles no se
   * actualizaban (habia que cerrar y volver a abrir) y la validacion de la venta
   * seguia usando el valor viejo.
   *
   * Los dias vendidos tambien restan: no se puede gozar lo que ya se cobro.
   */
  private recalcularDisponibles() {
    const generados = this.vacacion.diasGenerados || 0;
    const gozados = (this.periodos.data || [])
      .filter(p => p.estado === 'GOZADA')
      .reduce((acc, p) => acc + (p.diasUsados || 0), 0);
    const vendidos = (this.ventas.data || [])
      .filter(v => v.estado !== 'ANULADO')
      .reduce((acc, v) => acc + (v.dias || 0), 0);
    this.disponibles = generados - gozados - vendidos;
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

  onAprobarVenta(v: any) {
    this.vacacionService.onAprobarVenta(v.id, this.mainService.usuarioActual?.id)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.cargar(); });
  }

  onAnularVenta(v: any) {
    this.vacacionService.onAnularVenta(v.id)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.cargar(); });
  }

  onCerrar() {
    this.dialogRef.close(true);
  }
}
