import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';
import { CajaVirtual } from '../../caja-virtual/caja-virtual.model';
import { CajaVirtualService } from '../../caja-virtual/caja-virtual.service';
import { AguinaldoService } from '../aguinaldo.service';

export interface PagarAguinaldoDialogData {
  aguinaldoId: number;
  nombre?: string;
  monto?: number;
}

/**
 * Paga el aguinaldo por separado: selección de Caja Mayor + confirmación. El egreso
 * de caja lo hace el backend (AguinaldoService.pagar). Al quedar PAGADO deja de
 * sumarse en la liquidación mensual.
 */
@UntilDestroy()
@Component({
  selector: 'app-pagar-aguinaldo-dialog',
  templateUrl: './pagar-aguinaldo-dialog.component.html',
})
export class PagarAguinaldoDialogComponent implements OnInit {

  cajas: CajaVirtual[] = [];
  cajaControl = new FormControl(null);
  pagando = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PagarAguinaldoDialogData,
    private dialogRef: MatDialogRef<PagarAguinaldoDialogComponent>,
    private cajaVirtualService: CajaVirtualService,
    private aguinaldoService: AguinaldoService,
    private notificacion: NotificacionSnackbarService
  ) { }

  ngOnInit(): void {
    this.cajaVirtualService.onGetActivas().pipe(untilDestroyed(this))
      .subscribe((res: CajaVirtual[]) => {
        this.cajas = (res || []).filter(c => c.tipo === 'CAJA_MAYOR');
      });
  }

  onPagar(): void {
    if (this.cajaControl.value == null) {
      this.notificacion.notification$.next({ texto: 'Seleccione la Caja Mayor', color: NotificacionColor.warn, duracion: 3 });
      return;
    }
    this.pagando = true;
    this.aguinaldoService.onPagar(this.data.aguinaldoId, this.cajaControl.value)
      .pipe(untilDestroyed(this)).subscribe({
        next: (res) => {
          this.pagando = false;
          if (res != null) { this.dialogRef.close(res); }
        },
        error: () => (this.pagando = false),
      });
  }

  onCancelar(): void { this.dialogRef.close(); }
}
