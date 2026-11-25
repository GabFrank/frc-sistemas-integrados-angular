import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { NotificacionColor, NotificacionSnackbarService } from '../../../notificacion-snackbar.service';
import { limpiarMensajeGraphQL } from '../../../commons/core/utils/graphqlErrorUtils';
import { AnularChequeDialogComponent, AnularChequeDialogData } from './anular-cheque-dialog/anular-cheque-dialog.component';
import { AnulacionChequeInput, Cheque } from './cheque.model';
import { GetChequesAAnularGQL } from './graphql/getChequesAAnular';

const AL_CENTRAL = { clientName: 'servidor' };

/** Qué anular de los cheques: el motivo (null si no hay cheques) y los cheques, para imprimir sus comprobantes. */
export interface MotivoCheques {
  anulacion: AnulacionChequeInput | null;
  cheques: Cheque[];
}

/** Una sola de las tres: lo que se va a anular. */
export interface OrigenAnulacion {
  pagoId?: number;
  liquidacionId?: number;
  liquidacionFinalId?: number;
}

/**
 * El motivo de la lista para los cheques que anula una anulación (desktop #807): el de un cheque suelto, o los de un
 * pago, una liquidación o un finiquito.
 */
@Injectable({ providedIn: 'root' })
export class ChequeAnulacionService {

  constructor(
    private dialog: MatDialog,
    private chequesAAnularGQL: GetChequesAAnularGQL,
    private notificacion: NotificacionSnackbarService,
  ) { }

  /** Pide el motivo para estos cheques. null = el usuario volvió atrás. */
  pedirMotivo(cheques: Cheque[], detalle?: string): Observable<AnulacionChequeInput | null> {
    const data: AnularChequeDialogData = { cheques, detalle };
    // Foco en el diálogo, no en el select: un mat-select cerrado con foco elige opción con cualquier tecla (una «p»
    // suelta deja «Proveedor incorrecto» sin que se vea). El motivo se elige a propósito.
    return this.dialog.open(AnularChequeDialogComponent, { data, width: '560px', maxWidth: '95vw', autoFocus: 'dialog' }).afterClosed()
      .pipe(take(1), map(r => r || null));
  }

  /**
   * Si la anulación va a anular cheques, pide su motivo. Emite una vez: `{anulacion: null, cheques: []}` si no hay
   * cheques, el motivo y los cheques si los hay, o **null si no hay que anular**: el usuario volvió atrás, o no se
   * pudo saber qué cheques anula (se avisa; nunca se asume que no hay).
   */
  motivoParaChequesDe(origen: OrigenAnulacion, detalle?: string): Observable<MotivoCheques | null> {
    return this.chequesAAnularGQL.fetch({
      pagoId: origen.pagoId || null,
      liquidacionId: origen.liquidacionId || null,
      liquidacionFinalId: origen.liquidacionFinalId || null,
    }, { fetchPolicy: 'network-only', errorPolicy: 'all', context: AL_CENTRAL }).pipe(
      take(1),
      map(res => {
        if (res?.errors?.length) throw new Error(limpiarMensajeGraphQL(res.errors[0].message));
        if (!res?.data?.data) throw new Error('el servidor no respondió');
        return res.data.data;
      }),
      switchMap((cheques: Cheque[]) => cheques.length === 0
        ? of<MotivoCheques>({ anulacion: null, cheques: [] })
        : this.pedirMotivo(cheques, detalle).pipe(map(a => a ? { anulacion: a, cheques } : null))),
      catchError(e => {
        this.notificacion.notification$.next({
          texto: 'No se anuló nada: no se pudo saber qué cheques anula (' + (e?.message || 'error') + ').',
          color: NotificacionColor.warn, duracion: 6,
        });
        return of(null);
      }),
    );
  }
}
