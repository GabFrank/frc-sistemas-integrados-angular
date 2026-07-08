import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CargoService } from '../../../empresarial/cargo/cargo.service';
import { Cargo } from '../../../empresarial/cargo/cargo.model';
import { MainService } from '../../../../main.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LegajoService } from '../legajo.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface CambioCargoDialogData { funcionarioId: number; cargoActualId?: number; }

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CambioCargoDialogData,
    private dialogRef: MatDialogRef<CambioCargoDialogComponent>,
    private cargoService: CargoService,
    private legajoService: LegajoService,
    public mainService: MainService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.cargoService.onGetAll().pipe(untilDestroyed(this))
      .subscribe((res: Cargo[]) => { this.cargos = res || []; });
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
      .subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }

  onCancelar() { this.dialogRef.close(); }
}
