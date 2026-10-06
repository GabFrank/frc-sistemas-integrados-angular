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
  cargaFallo = false;
  isAnulando = false;
  /** Hubo un intento de anular: al cerrar, quien abrió el detalle relee. */
  private huboIntento = false;

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
    this.cargar(true);
  }

  /** `inicial = false` es la relectura tras un intento de anular: no tapa el detalle con «Cargando…». */
  private cargar(inicial: boolean): void {
    this.service.onGetOperacion(this.data.operacionId).pipe(untilDestroyed(this)).subscribe({
      error: () => {
        if (!inicial) {
          // No se sabe cómo quedó: se cierra y quien abrió relee, antes que dejar «Anular» ofrecido.
          this.dialogRef.close(true);
          return;
        }
        // Sin respuesta: no «Cargando…» eterno ni «No se encontró la operación», que sería falso (#390).
        this.isLoading = false;
        this.cargaFallo = true;
      },
      next: op => {
        this.isLoading = false;
        this.isAnulando = false;
        if (!op) return;
        this.op = op;
        this.tipoLabel = this.tipoLabels[op.tipoOperacion as any] || op.tipoOperacion;
        this.origenLabel = this.fuenteLabel(op.cajaMayorOrigen, op.cuentaBancariaOrigen);
        this.destinoLabel = this.fuenteLabel(op.cajaMayorDestino, op.cuentaBancariaDestino);
        this.mostrarDestino = !!(op.cajaMayorDestino || op.cuentaBancariaDestino || op.montoDestino);
        this.mostrarCotizacion = !!(op.cotizacion && op.cotizacion !== 1);
      }
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
      // Desde acá el cierre pasa por «Cerrar», que avisa a quien abrió que relea (Esc y el clic
      // afuera cerrarían sin valor). «Anular» y «Cerrar» quedan deshabilitados hasta releer.
      this.huboIntento = true;
      this.dialogRef.disableClose = true;
      // El aviso de éxito es propio (más específico); el de error lo da onSaveCustom.
      this.service.onAnular(this.op!.id, undefined, { avisarExito: false }).pipe(untilDestroyed(this)).subscribe({
        next: r => {
          if (r != null) {
            this.isAnulando = false;
            this.notificacion.notification$.next({ texto: 'Operación anulada', color: NotificacionColor.success, duracion: 3 });
            this.dialogRef.close(true);
            return;
          }
          this.notificacion.openWarn('No se pudo confirmar la anulación: se vuelve a leer para verificarla.', 6);
          this.cargar(false);
        },
        // Rechazo o sin respuesta: la operación pudo haber quedado anulada (ahora o antes). Se relee
        // acá adentro para no dejar «Anular» ofrecido sobre un estado viejo (#390).
        error: () => this.cargar(false)
      });
    });
  }

  cerrar(): void { this.dialogRef.close(this.huboIntento ? true : null); }
}
