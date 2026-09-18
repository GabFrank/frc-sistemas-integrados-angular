import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { PageInfo } from '../../../app.component';
import { NotaCredito, NotaCreditoItem } from './nota-credito.model';
import { NotaCreditosGQL } from './graphql/notaCreditos';
import { NotaCreditoItemsGQL } from './graphql/notaCreditoItems';
import { NotaCreditosPorFacturaGQL } from './graphql/notaCreditosPorFactura';
import { DocumentoElectronicoDeNotaCreditoGQL } from './graphql/documentoElectronicoDeNotaCredito';
import { ImprimirNotaCreditoGQL } from './graphql/imprimirNotaCredito';
import { CrearNotaCreditoDesdeFacturaGQL } from './graphql/crearNotaCreditoDesdeFactura';
import { GenerarYEnviarNotaCreditoGQL } from './graphql/generarYEnviarNotaCredito';
import { ReenviarNotaCreditoGQL } from './graphql/reenviarNotaCredito';
import { AnularNotaCreditoGQL } from './graphql/anularNotaCredito';

/** Notas de crédito electrónicas. Todo va contra el central (`servidor = true`, el default). */
@Injectable({ providedIn: 'root' })
export class NotaCreditoService {

  constructor(
    private genericService: GenericCrudService,
    private notaCreditosGQL: NotaCreditosGQL,
    private notaCreditoItemsGQL: NotaCreditoItemsGQL,
    private notaCreditosPorFacturaGQL: NotaCreditosPorFacturaGQL,
    private documentoElectronicoGQL: DocumentoElectronicoDeNotaCreditoGQL,
    private imprimirGQL: ImprimirNotaCreditoGQL,
    private crearDesdeFacturaGQL: CrearNotaCreditoDesdeFacturaGQL,
    private generarYEnviarGQL: GenerarYEnviarNotaCreditoGQL,
    private reenviarGQL: ReenviarNotaCreditoGQL,
    private anularGQL: AnularNotaCreditoGQL
  ) {}

  onGetPorFiltro(sucursalId: number, fechaInicio: string, fechaFin: string,
                 page: number, size: number): Observable<PageInfo<NotaCredito>> {
    return this.genericService.onCustomQuery(this.notaCreditosGQL,
      { sucursalId, fechaInicio, fechaFin, page, size });
  }

  onGetItems(notaCreditoId: number, sucursalId: number): Observable<NotaCreditoItem[]> {
    return this.genericService.onCustomQuery(this.notaCreditoItemsGQL, { notaCreditoId, sucursalId });
  }

  /** Para deshabilitar el botón de la factura cuando ya tiene su nota activa. */
  onGetPorFactura(facturaLegalId: number, sucursalId: number): Observable<NotaCredito[]> {
    return this.genericService.onCustomQuery(this.notaCreditosPorFacturaGQL,
      { facturaLegalId, sucursalId }, true, null, true);
  }

  onGetDocumentoElectronico(notaCreditoId: number, sucursalId: number): Observable<any> {
    return this.genericService.onCustomQuery(this.documentoElectronicoGQL,
      { notaCreditoId, sucursalId }, true, null, true);
  }

  onImprimir(id: number, sucursalId: number): Observable<string> {
    return this.genericService.onCustomQuery(this.imprimirGQL,
      { id, sucursalId, anchoMm: null, escpos: false });
  }

  /** NC total: el central copia ítems y totales de la factura y hereda su moneda. */
  onCrearDesdeFactura(facturaLegalId: number, sucursalId: number, motivo: string,
                      descripcionMotivo: string, usuarioId: number): Observable<NotaCredito> {
    return this.genericService.onCustomMutation(this.crearDesdeFacturaGQL,
      { facturaLegalId, sucursalId, motivo, descripcionMotivo, usuarioId });
  }

  onGenerarYEnviar(id: number, sucursalId: number): Observable<any> {
    return this.genericService.onCustomMutation(this.generarYEnviarGQL, { id, sucursalId });
  }

  onReenviar(id: number, sucursalId: number): Observable<any> {
    return this.genericService.onCustomMutation(this.reenviarGQL, { id, sucursalId });
  }

  onAnular(id: number, sucursalId: number): Observable<NotaCredito> {
    return this.genericService.onCustomMutation(this.anularGQL, { id, sucursalId });
  }
}
