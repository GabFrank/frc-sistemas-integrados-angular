import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { OperacionFinanciera } from '../operacion-financiera.model';
import { OperacionFinancieraService } from '../operacion-financiera.service';
import { DialogosService } from '../../../../shared/components/dialogos/dialogos.service';
import { NotificacionSnackbarService, NotificacionColor } from '../../../../notificacion-snackbar.service';

export interface OperacionFinancieraDetalleData {
  operacionId: number;
  puedeGestionar?: boolean;
}

/** Detalle read-only de una operación financiera: muestra ambas patas (origen caja/banco →
 * destino caja/banco) con la conversión, que en la tabla de movimientos viven separadas por fuente. */
@UntilDestroy({ checkProperties: true })
@Component({
  selector: 'app-operacion-financiera-detalle-dialog',
  templateUrl: './operacion-financiera-detalle-dialog.component.html',
  styleUrls: ['./operacion-financiera-detalle-dialog.component.scss']
})
export class OperacionFinancieraDetalleDialogComponent implements OnInit {

  op: OperacionFinanciera | null = null;
  isLoading = true;
  isAnulando = false;

  tipoLabel = '';
  origenLabel = '';
  destinoLabel = '';
  mostrarDestino = false;
  mostrarCotizacion = false;

  private tipoLabels: Record<string, string> = {
    CAMBIO_DIVISA: 'Cambio de divisa',
    DEPOSITO_BANCARIO: 'Depósito bancario',
    RETIRO_BANCARIO: 'Retiro bancario',
    TRANSFERENCIA_ENTRE_CAJAS: 'Transferencia entre cajas',
    TRANSFERENCIA_BANCARIA: 'Transferencia bancaria',
  };

  constructor(
    private dialogRef: MatDialogRef<OperacionFinancieraDetalleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OperacionFinancieraDetalleData,
    private service: OperacionFinancieraService,
    private dialogos: DialogosService,
    private notificacion: NotificacionSnackbarService,
  ) {}

  ngOnInit(): void {
    this.service.onGetOperacion(this.data.operacionId).pipe(untilDestroyed(this)).subscribe(op => {
      this.isLoading = false;
      if (!op) return;
      this.op = op;
      this.tipoLabel = this.tipoLabels[op.tipoOperacion as any] || op.tipoOperacion;
      this.origenLabel = this.fuenteLabel(op.cajaMayorOrigen, op.cuentaBancariaOrigen);
      this.destinoLabel = this.fuenteLabel(op.cajaMayorDestino, op.cuentaBancariaDestino);
      this.mostrarDestino = !!(op.cajaMayorDestino || op.cuentaBancariaDestino || op.montoDestino);
      this.mostrarCotizacion = !!(op.cotizacion && op.cotizacion !== 1);
    });
  }

  private fuenteLabel(caja: any, cuenta: any): string {
    if (caja) return caja.nombre || 'Caja Mayor';
    if (cuenta) return `${cuenta.banco?.nombre || 'Banco'} · ${cuenta.numero || ''}`;
    return '—';
  }

  onAnular(): void {
    if (!this.op || this.op.anulado) return;
    this.dialogos.confirm(
      'Anular operación financiera',
      '¿Anular la operación completa? Se revertirán TODOS sus movimientos (origen y destino).',
      null, null, true, 'Sí, anular', 'No'
    ).pipe(untilDestroyed(this)).subscribe(res => {
      if (res !== true) return;
      this.isAnulando = true;
      this.service.onAnular(this.op!.id).pipe(untilDestroyed(this)).subscribe({
        next: r => {
          this.isAnulando = false;
          if (r != null) {
            this.notificacion.notification$.next({ texto: 'Operación anulada', color: NotificacionColor.success, duracion: 3 });
            this.dialogRef.close(true);
          }
        },
        error: err => {
          this.isAnulando = false;
          const m = err?.graphQLErrors?.[0]?.message || err?.message || 'No se pudo anular';
          this.notificacion.notification$.next({ texto: m, color: NotificacionColor.warn, duracion: 5 });
        }
      });
    });
  }

  cerrar(): void { this.dialogRef.close(null); }
}
