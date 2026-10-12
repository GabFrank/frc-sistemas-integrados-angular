import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from "../../../../generics/generic-crud.service";
import { TIMEOUT_POR_DEFECTO_MS } from "../../../../shared/services/timeout-link";
import { ConfiguracionService } from "../../../../shared/services/configuracion.service";
import {
  EtiquetasSeparadoPdfGQL,
  ImprimirEtiquetasSeparadoGQL,
} from "./graphql/etiquetas-devolucion.gql";

/** Impresión de etiquetas de separado (ticket térmico y PDF A4). */
@Injectable({ providedIn: "root" })
export class EtiquetasDevolucionService {
  constructor(
    private genericService: GenericCrudService,
    private configService: ConfiguracionService,
    private pdfGQL: EtiquetasSeparadoPdfGQL,
    private ticketGQL: ImprimirEtiquetasSeparadoGQL
  ) {}

  /** PDF A4 (Base64). */
  onGetPdf(devolucionId: number): Observable<string> {
    return this.genericService.onCustomQuery(
      this.pdfGQL,
      { devolucionId },
      true,
      PROPAGAR_ERROR_DE_RED,
      true,
      // Dos suscriptores, los dos con error: (#390).
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true }
    );
  }

  /** Imprime en térmica (el backend usa impresora/ancho de la config si no se pasan). */
  onImprimirTicket(devolucionId: number): Observable<boolean> {
    const printerName = this.configService?.getConfig()?.printers?.ticket;
    return this.genericService.onCustomMutation(this.ticketGQL, {
      devolucionId,
      printerName,
    });
  }
}
