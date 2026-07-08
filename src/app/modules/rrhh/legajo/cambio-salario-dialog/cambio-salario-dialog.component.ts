import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { MonedaService } from '../../../financiero/moneda/moneda.service';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LegajoService } from '../legajo.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface CambioSalarioDialogData { funcionarioId: number; salarioActual?: number; monedaActualId?: number; }

@UntilDestroy()
@Component({
  selector: 'app-cambio-salario-dialog',
  templateUrl: './cambio-salario-dialog.component.html',
  styleUrls: ['./cambio-salario-dialog.component.scss']
})
export class CambioSalarioDialogComponent implements OnInit {

  monedas: Moneda[] = [];
  salarioControl = new FormControl(null, [Validators.required, Validators.min(0)]);
  monedaControl = new FormControl(null);
  fechaControl = new FormControl(new Date());
  motivoControl = new FormControl(null);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CambioSalarioDialogData,
    private dialogRef: MatDialogRef<CambioSalarioDialogComponent>,
    private monedaService: MonedaService,
    private legajoService: LegajoService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    if (this.data.monedaActualId != null) { this.monedaControl.setValue(this.data.monedaActualId); }
    this.monedaService.onGetAll().pipe(untilDestroyed(this))
      .subscribe((res: Moneda[]) => { this.monedas = res || []; });
  }

  onGuardar() {
    if (this.salarioControl.invalid) {
      this.notificacion.notification$.next({ texto: 'Ingrese el nuevo salario', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    const input = {
      funcionarioId: this.data.funcionarioId,
      nuevoSalario: this.salarioControl.value,
      monedaId: this.monedaControl.value,
      fecha: dateToString(this.fechaControl.value),
      motivo: this.motivoControl.value ? this.motivoControl.value.toUpperCase() : null,
      autorizadoPorId: this.mainService.usuarioActual?.id
    };
    this.legajoService.onCambiarSalario(input).pipe(untilDestroyed(this))
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }

  onCancelar() { this.dialogRef.close(); }
}
