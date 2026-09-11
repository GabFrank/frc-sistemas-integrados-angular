import { Injectable } from '@angular/core';
import { merge, Observable, timer } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, takeWhile } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { CapturaCupon, CapturaCuponQr } from './captura-cupon.model';
import { CapturaCuponGQL, CapturaCuponSubGQL, CrearCapturaCuponGQL } from './graphql/capturaCupon';

/**
 * La captura de la foto del cupón, del lado de la caja.
 *
 * Todo va contra el **filial** (`servidor: false`): la página que abre el teléfono la sirve él,
 * la imagen la recibe él y el OCR corre adentro suyo. El central no participa.
 */
@Injectable({ providedIn: 'root' })
export class CapturaCuponService {

  /** Cada cuánto se le vuelve a preguntar al filial mientras se espera la foto. */
  private static readonly MS_SONDEO = 3000;

  constructor(
    private genericService: GenericCrudService,
    private crearGQL: CrearCapturaCuponGQL,
    private consultarGQL: CapturaCuponGQL,
    private subGQL: CapturaCuponSubGQL
  ) {}

  /** Abre una captura. Lo que vuelve es lo que se codifica en el QR. */
  onCrear(cajaId: number, sucursalId: number, usuarioId?: number): Observable<CapturaCuponQr> {
    return this.genericService
      .onCustomMutation(this.crearGQL, { cajaId, sucursalId, usuarioId }, false)
      .pipe(map((res) => res as CapturaCuponQr));
  }

  /**
   * Espera el resultado de una captura, por las dos vías a la vez.
   *
   * La subscription avisa en el momento; el sondeo cubre el hueco que la subscription no puede
   * cubrir. El observable del filial es **caliente**: si el desktop no estaba suscrito en ese
   * instante --se reinició, perdió la red un segundo, el aviso salió entre medio-- el aviso se
   * pierde y no vuelve. Sin el sondeo, la foto queda procesada en la base y el cajero mirando un
   * spinner que no termina nunca. Es el caso 4 de los modos de falla (§2.10 de FASE-2).
   *
   * Emite cada desenlace y **sigue vivo mientras haya ERROR**: un error no consume el token, así
   * que el cajero saca otra foto desde el mismo teléfono sin volver a la caja a pedir otro QR.
   * Recién con LISTO termina. El `distinctUntilChanged` está porque el sondeo repite el mismo
   * estado cada tres segundos y si no el mensaje de error parpadearía.
   */
  onEsperar(token: string, cajaId: number): Observable<CapturaCupon> {
    // El timbre. No trae el texto del cupón ni el token: la subscription del filial es anónima,
    // así que sólo dice "hay novedad en esta caja" y el contenido se pide aparte, con el token
    // que esta caja ya tiene de cuando pidió la captura.
    //
    // Se usa el GQL directo y no `genericService.onCustomSub`: ese helper completa el
    // observable con el PRIMER evento que llega. Acá el canal es de toda la sucursal, así que
    // el primer aviso puede ser el de otra caja; con onCustomSub se descartaría por token y el
    // stream quedaría cerrado justo antes de que llegue el nuestro.
    const porAviso = this.subGQL
      .subscribe(null, {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all',
        context: { clientName: null },   // null = filial
      })
      .pipe(
        map((res: any) => res?.data?.data as { cajaId?: number }),
        // Se comparaba por token, pero el token ya no viaja: difundirlo dejaba que cualquier
        // sesión del filial leyera el cupón de otra caja. `==` y no `===` porque `cajaId` es un
        // ID de GraphQL y llega como string.
        // eslint-disable-next-line eqeqeq
        filter((t) => t != null && t.cajaId != null && t.cajaId == cajaId),
        switchMap(() => this.consultar(token))
      );

    const porSondeo = timer(CapturaCuponService.MS_SONDEO, CapturaCuponService.MS_SONDEO).pipe(
      switchMap(() => this.consultar(token))
    );

    return merge(porAviso, porSondeo).pipe(
      filter((c) => c.estado === 'LISTO' || c.estado === 'ERROR'),
      distinctUntilChanged((a, b) => a.estado === b.estado && a.error === b.error && a.intentos === b.intentos),
      takeWhile((c) => c.estado !== 'LISTO', true)
    );
  }

  /**
   * El estado completo de una captura. Es la **única** vía del texto leído: va por HTTP con la
   * sesión del cajero, a diferencia de la subscription.
   *
   * `silentLoad` porque esto corre de fondo: sin eso el diálogo de "Buscando..." parpadearía
   * arriba del QR cada tres segundos.
   */
  private consultar(token: string): Observable<CapturaCupon> {
    return this.genericService
      .onCustomQuery(this.consultarGQL, { token }, false, null, true)
      .pipe(
        map((res) => res as CapturaCupon),
        filter((c) => c != null)
      );
  }
}
