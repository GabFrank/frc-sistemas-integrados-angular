import { Injectable } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map, switchMap, take } from "rxjs/operators";
import { ElectronService } from "../../../commons/core/electron/electron.service";
import { GenericCrudService } from "../../../generics/generic-crud.service";
import { NotificacionColor, NotificacionSnackbarService } from "../../../notificacion-snackbar.service";
import { ConfiguracionService } from "../configuracion.service";
import { SenaCuponEscposGQL } from "./graphql/senaCuponEscpos";
import { TicketEscposGQL } from "./graphql/ticketEscpos";

/** Qué comprobante del POS genera la filial (enum TicketEscposTipo del filial). */
export type TicketEscposTipo = "VENTA" | "FACTURA" | "BALANCE" | "GASTO" | "RETIRO" | "DELIVERY";

/**
 * Impresión del POS desde esta PC ("Imprimir desde esta PC" en Configuración).
 *
 * En ese modo la filial no imprime: genera el comprobante en ESC/POS, lo devuelve en base64 y acá se
 * imprime con Electron en `impresoraLocal`. En modo "Imprimir por servidor" nada de esto se usa y
 * cada service manda exactamente lo de siempre.
 *
 * Solo aplica a operaciones contra la filial (`servidor === false`): las consultas que devuelven el
 * ticket existen en la filial, no en el central. Ver docs/impresion-pos-desde-cliente.md.
 *
 * Imprimir nunca rompe la operación: si falla, lo que se guardó ya está guardado y se avisa con un
 * snackbar para que el cajero use la reimpresión.
 */
@Injectable({
  providedIn: "root",
})
export class ImpresionPosService {
  constructor(
    private configService: ConfiguracionService,
    private electronService: ElectronService,
    private genericService: GenericCrudService,
    private ticketEscpos: TicketEscposGQL,
    private senaCuponEscpos: SenaCuponEscposGQL,
    private notificacion: NotificacionSnackbarService
  ) {}

  /** ¿Esta operación la imprime el frontend? Solo contra la filial y en modo "desde esta PC". */
  porCliente(servidor: boolean): boolean {
    return servidor === false && this.electronService.isElectron && this.configService.imprimirPorFrontend();
  }

  /** `local` configurado en esta PC: sale en el encabezado de los tickets, igual que por servidor. */
  get local(): string {
    return this.configService.getConfig()?.local;
  }

  /**
   * Imprime un ESC/POS (base64) en la impresora local. `que` nombra el comprobante en los avisos.
   * Sin base64 no hay nada que imprimir (la ruta de facturación no lleva papel) y no se avisa.
   * `avisar = false` para quien ya avisa por su cuenta cuando el papel no sale.
   */
  imprimir(payloadBase64: string, que: string, avisar = true): Observable<boolean> {
    if (!payloadBase64) {
      return of(false);
    }
    const imp = this.configService.getConfig()?.impresoraLocal;
    if (!imp) {
      if (avisar) this.avisarFallo(que, "no hay impresora configurada en esta PC");
      return of(false);
    }
    return this.electronService
      .printLocal({ conexion: imp.conexion, cola: imp.cola, payloadBase64 })
      .pipe(
        take(1),
        map((r) => {
          if (!r?.success && avisar) {
            this.avisarFallo(que, r?.error);
          }
          return r?.success === true;
        }),
        catchError((e) => {
          if (avisar) this.avisarFallo(que, e?.message);
          return of(false);
        })
      );
  }

  /** Pide a la filial el comprobante `tipo` de `id` y lo imprime acá. */
  imprimirTicket(tipo: TicketEscposTipo, id: number, que: string, reimpresion?: boolean): Observable<boolean> {
    return this.genericService
      .onCustomQuery(
        this.ticketEscpos,
        { tipo, id, reimpresion: reimpresion ?? null, local: this.local },
        false,
        { networkError: { show: true, propagate: true } },
        true
      )
      .pipe(
        take(1),
        switchMap((base64: string) => {
          if (!base64) {
            this.avisarFallo(que, "la filial no devolvió el comprobante");
            return of(false);
          }
          return this.imprimir(base64, que);
        }),
        catchError((e) => {
          this.avisarFallo(que, e?.message);
          return of(false);
        })
      );
  }

  /**
   * La seña de un cobro con tarjeta: la filial arma el mismo ticket que imprimirSenaCupon. No avisa:
   * quien llama ya le dice al cajero qué anotar si el papel no sale (venta-touch).
   */
  imprimirSenaCupon(input: any): Observable<boolean> {
    return this.genericService
      .onCustomQuery(
        this.senaCuponEscpos,
        { input, local: this.local },
        false,
        { networkError: { show: true, propagate: true } },
        true
      )
      .pipe(
        take(1),
        switchMap((base64: string) => (base64 ? this.imprimir(base64, "La seña del cupón", false) : of(false))),
        catchError(() => of(false))
      );
  }

  private avisarFallo(que: string, detalle?: string): void {
    this.notificacion.notification$.next({
      texto: que + " no se pudo imprimir en esta PC" + (detalle ? ": " + detalle : "") + ". Usá la reimpresión.",
      color: NotificacionColor.warn,
      duracion: 8,
    });
  }
}
