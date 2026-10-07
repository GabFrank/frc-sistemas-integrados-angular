import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { catchError, defaultIfEmpty, finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { erroresDeRechazo } from '../../../commons/core/utils/graphqlErrorUtils';
import { esTimeoutDeLink } from '../../../shared/services/timeout-link';
import { CargandoDialogService } from '../../../shared/components/cargando-dialog/cargando-dialog.service';
import { MotivoDialogComponent, MotivoDialogData } from '../../../shared/components/motivo-dialog/motivo-dialog.component';
import { PagarComprasService } from '../caja-virtual/pagar-compras-dialog/pagar-compras.service';
import { AccionAnularMovimientoBancario } from './movimiento-bancario-anulacion';
import { MovimientoBancario } from './operacion-financiera.model';
import { OperacionFinancieraService } from './operacion-financiera.service';

const SIN_CONFIRMAR = 'No se pudo confirmar la anulación: se vuelve a leer para verificarla.';

/**
 * Anula un movimiento bancario desde el módulo dueño, para las dos tablas que los listan (el
 * bloque de banco de la caja mayor y los movimientos de una cuenta).
 */
@Injectable({
  providedIn: 'root'
})
export class MovimientoBancarioAnulacionService {

  constructor(
    private dialog: MatDialog,
    private cargandoService: CargandoDialogService,
    private notificacion: NotificacionSnackbarService,
    private pagarComprasService: PagarComprasService,
    private operacionFinancieraService: OperacionFinancieraService,
  ) { }

  /**
   * Pide el motivo y anula. Siempre emite una vez y completa: `true` si **hay que releer** (se intentó anular:
   * salió bien, el servidor lo rechazó o quedó sin respuesta) y `false` si el usuario volvió atrás. El aviso ya
   * salió, una sola vez.
   *
   * Antes un error devolvía lo mismo que volver atrás y nadie releía: tras un «sin respuesta» la anulación pudo
   * haberse aplicado, y un rechazo «ya está anulado» significa que la pantalla estaba vieja (#390).
   */
  anular(mov: MovimientoBancario, accion: AccionAnularMovimientoBancario): Observable<boolean> {
    if (!mov || !accion?.habilitada) return of(false);
    const data: MotivoDialogData = {
      titulo: accion.titulo,
      mensaje: accion.mensaje,
      detalle: accion.aviso,
      botonConfirmar: 'Sí, anular',
    };
    return this.dialog.open(MotivoDialogComponent, { data, width: '520px', maxWidth: '95vw' }).afterClosed().pipe(
      take(1),
      switchMap((motivo: string | null) => motivo ? this.ejecutar(mov, accion, motivo) : of(false)),
      defaultIfEmpty(false),
    );
  }

  private ejecutar(mov: MovimientoBancario, accion: AccionAnularMovimientoBancario, motivo: string): Observable<boolean> {
    const esPago = accion.via === 'PAGO';
    // La anulación del pago va por Apollo directo: no abre el «Guardando…» ni avisa su error.
    // La de la operación va por onSaveCustom, que hace las dos cosas.
    const requestId = esPago ? this.cargandoService.openDialog(false, 'Anulando...').requestId : null;
    const llamada: Observable<any> = esPago
      ? this.pagarComprasService.onAnularPago(mov.pagoId, motivo)
      : this.operacionFinancieraService.onAnular(mov.origenId, motivo, { avisarExito: false });
    return llamada.pipe(
      take(1),
      map(res => res != null),
      defaultIfEmpty(false),
      tap(anulado => {
        if (anulado) {
          this.avisar(esPago ? 'Pago anulado' : 'Operación financiera anulada', NotificacionColor.success, 3);
        } else {
          // Ni error ni resultado: no se sabe si se anuló.
          this.avisar(SIN_CONFIRMAR, NotificacionColor.warn, 6);
        }
      }),
      catchError(err => {
        // La operación va por onSaveCustom, que ya avisó el rechazo, el error de red y la respuesta vacía; el
        // corte por tiempo lo avisa el link. El pago (Apollo directo) no lo avisa nadie.
        if (esPago && !esTimeoutDeLink(err)) {
          const rechazo = erroresDeRechazo(err);
          this.avisar(rechazo ? (rechazo[0]?.message || err?.message || 'No se pudo anular') : SIN_CONFIRMAR,
            NotificacionColor.warn, rechazo ? 5 : 6);
        }
        return of(false);
      }),
      // Se intentó anular: con cualquier resultado hay que releer.
      map(() => true),
      finalize(() => this.cargandoService.closeDialog(requestId)),
    );
  }

  private avisar(texto: string, color: NotificacionColor, duracion: number) {
    this.notificacion.notification$.next({ texto, color, duracion });
  }
}
