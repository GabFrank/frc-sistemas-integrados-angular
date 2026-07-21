import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CargoService } from '../../../empresarial/cargo/cargo.service';
import { Cargo } from '../../../empresarial/cargo/cargo.model';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LegajoService } from '../legajo.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface CambioCargoDialogData {
  funcionarioId: number;
  cargoActualId?: number;
  cargoActualNombre?: string;
  salarioActual?: number;
  monedaActualId?: number;
}

@UntilDestroy()
@Component({
  selector: 'app-cambio-cargo-dialog',
  templateUrl: './cambio-cargo-dialog.component.html',
  styleUrls: ['./cambio-cargo-dialog.component.scss']
})
export class CambioCargoDialogComponent implements OnInit {

  cargos: Cargo[] = [];
  cargoControl = new FormControl(null, Validators.required);
  fechaControl = new FormControl(new Date());
  motivoControl = new FormControl(null);
  actualizarSalarioControl = new FormControl(false);
  monedaControl = new FormControl(null);
  monedas: Moneda[] = [];
  // sueldo base del cargo seleccionado (calculado al elegir, no en template)
  cargoSeleccionadoSueldo: number = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CambioCargoDialogData,
    private dialogRef: MatDialogRef<CambioCargoDialogComponent>,
    private cargoService: CargoService,
    private monedaService: MonedaService,
    private legajoService: LegajoService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.cargoService.onGetAll().pipe(untilDestroyed(this))
      .subscribe((res: Cargo[]) => { this.cargos = res || []; });
    this.monedaService.onGetAll().pipe(untilDestroyed(this))
      .subscribe((res: Moneda[]) => {
        this.monedas = res || [];
        // preseleccionar la del funcionario; si no tiene, la local (guaraní) o la primera
        if (this.data.monedaActualId != null) {
          this.monedaControl.setValue(this.data.monedaActualId);
        } else {
          const local = this.monedas.find(m => (m.denominacion || '').toUpperCase().includes('GUARANI'));
          this.monedaControl.setValue(local ? local.id : (this.monedas[0] ? this.monedas[0].id : null));
        }
      });
  }

  onCargoChange() {
    const c = this.cargos.find(x => x.id === this.cargoControl.value);
    this.cargoSeleccionadoSueldo = (c && c.sueldoBase != null) ? c.sueldoBase : null;
    // proponer actualizar el salario si el cargo tiene sueldo base distinto al actual
    this.actualizarSalarioControl.setValue(
      this.cargoSeleccionadoSueldo != null && this.cargoSeleccionadoSueldo !== this.data.salarioActual
    );
  }

  onGuardar() {
    if (this.cargoControl.invalid) {
      this.notificacion.notification$.next({ texto: 'Seleccione el nuevo cargo', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    const input = {
      funcionarioId: this.data.funcionarioId,
      cargoId: this.cargoControl.value,
      fecha: dateToString(this.fechaControl.value),
      motivo: this.motivoControl.value ? this.motivoControl.value.toUpperCase() : null,
      autorizadoPorId: this.mainService.usuarioActual?.id
    };
    this.legajoService.onCambiarCargo(input).pipe(untilDestroyed(this))
      .subscribe(res => {
        if (res == null) { return; }
        // si se pidió, ajustar también el salario al sueldo base del nuevo cargo
        if (this.actualizarSalarioControl.value && this.cargoSeleccionadoSueldo != null) {
          const salInput = {
            funcionarioId: this.data.funcionarioId,
            nuevoSalario: this.cargoSeleccionadoSueldo,
            monedaId: this.monedaControl.value,
            fecha: dateToString(this.fechaControl.value),
            motivo: 'AJUSTE POR CAMBIO DE CARGO' + (this.motivoControl.value ? ' - ' + this.motivoControl.value.toUpperCase() : ''),
            autorizadoPorId: this.mainService.usuarioActual?.id
          };
          this.legajoService.onCambiarSalario(salInput).pipe(untilDestroyed(this))
            .subscribe(res2 => { this.dialogRef.close(res2 != null ? res2 : res); });
        } else {
          this.dialogRef.close(res);
        }
      });
  }

  onCancelar() { this.dialogRef.close(); }
}
