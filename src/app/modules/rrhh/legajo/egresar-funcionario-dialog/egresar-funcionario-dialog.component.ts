import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LegajoService } from '../legajo.service';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export interface EgresarFuncionarioDialogData { funcionarioId: number; nombre?: string; }

@UntilDestroy()
@Component({
  selector: 'app-egresar-funcionario-dialog',
  templateUrl: './egresar-funcionario-dialog.component.html',
  styleUrls: ['./egresar-funcionario-dialog.component.scss']
})
export class EgresarFuncionarioDialogComponent {

  fechaControl = new FormControl(new Date());
  motivoControl = new FormControl(null, Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EgresarFuncionarioDialogData,
    private dialogRef: MatDialogRef<EgresarFuncionarioDialogComponent>,
    private legajoService: LegajoService,
    private notificacion: NotificacionSnackbarService
  ) { }

  onEgresar() {
    if (this.motivoControl.invalid) {
      this.notificacion.notification$.next({ texto: 'Ingrese el motivo del egreso', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    const motivo = this.motivoControl.value ? this.motivoControl.value.toUpperCase() : null;
    this.legajoService.onEgresar(this.data.funcionarioId, dateToString(this.fechaControl.value), motivo)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) this.dialogRef.close(res); });
  }

  onCancelar() { this.dialogRef.close(); }
}
