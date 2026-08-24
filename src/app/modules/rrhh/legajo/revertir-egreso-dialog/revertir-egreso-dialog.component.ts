import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { LegajoService } from '../legajo.service';

export interface RevertirEgresoDialogData {
  funcionarioId: number;
  nombre?: string;
  fechaEgreso?: any;
  motivoEgreso?: string;
  creditoActual?: number;
  /** Snapshot que dejó el egreso, o null si es anterior al histórico. */
  snapshot?: any;
}

/**
 * Deshace un egreso hecho por error.
 *
 * Pide el crédito porque el egreso lo pone en cero y no queda guardado en ninguna tabla:
 * el backend no puede recuperarlo solo. Por eso el diálogo muestra el valor actual (que
 * después de un egreso es 0) y avisa de dónde sacar el anterior.
 */
@UntilDestroy()
@Component({
  selector: 'app-revertir-egreso-dialog',
  templateUrl: './revertir-egreso-dialog.component.html',
  styleUrls: ['./revertir-egreso-dialog.component.scss']
})
export class RevertirEgresoDialogComponent {

  creditoControl = new FormControl(0, [Validators.required, Validators.min(0)]);
  motivoControl = new FormControl(null, Validators.required);

  /** Precalculados: el repo no llama funciones desde el HTML. */
  creditoActualTexto = '';
  /** true cuando el egreso dejó snapshot: el crédito viene cargado y no hay que buscarlo. */
  haySnapshot = false;
  tipoClienteAnterior = '';
  egresadoPorTexto = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RevertirEgresoDialogData,
    private dialogRef: MatDialogRef<RevertirEgresoDialogComponent>,
    private legajoService: LegajoService,
    private notificacion: NotificacionSnackbarService
  ) {
    this.creditoActualTexto = (this.data?.creditoActual ?? 0).toLocaleString('es-PY');

    const snap = this.data?.snapshot;
    this.haySnapshot = snap != null;
    if (this.haySnapshot) {
      // El egreso guardó lo que destruyó: se precarga y queda editable, porque entre el
      // egreso y la reversa el negocio pudo cambiar.
      this.creditoControl.setValue(snap.creditoAnterior ?? 0);
      this.tipoClienteAnterior = snap.clienteTipoAnterior || '';
      this.egresadoPorTexto = snap.egresadoPor?.nickname || '';
    }
  }

  onRevertir() {
    if (this.motivoControl.invalid) {
      this.notificacion.notification$.next({
        texto: 'Ingrese el motivo de la reversión', color: NotificacionColor.warn, duracion: 3
      });
      return;
    }
    if (this.creditoControl.invalid) {
      this.notificacion.notification$.next({
        texto: 'El crédito a restaurar no puede quedar vacío ni ser negativo',
        color: NotificacionColor.warn, duracion: 4
      });
      return;
    }
    const motivo = this.motivoControl.value ? this.motivoControl.value.toUpperCase() : null;
    this.legajoService.onRevertirEgreso(this.data.funcionarioId, this.creditoControl.value, motivo)
      .pipe(untilDestroyed(this)).subscribe(res => { if (res != null) { this.dialogRef.close(res); } });
  }

  onCancelar() { this.dialogRef.close(); }
}
