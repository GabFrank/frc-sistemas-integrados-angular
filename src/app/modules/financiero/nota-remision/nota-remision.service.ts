import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { PageInfo } from '../../../app.component';
import {
  NotaRemision,
  NotaRemisionInput,
  NotaRemisionItem,
  NotaRemisionItemInput,
  NotaRemisionPrellenada,
  OrigenNotaRemision
} from './nota-remision.model';
import { NotaRemisionesGQL } from './graphql/notaRemisiones';
import { NotaRemisionGQL } from './graphql/notaRemision';
import { NotaRemisionItemsGQL } from './graphql/notaRemisionItems';
import { NotaRemisionPorTransferenciaGQL } from './graphql/notaRemisionPorTransferencia';
import { DocumentoElectronicoDeNotaRemisionGQL } from './graphql/documentoElectronicoDeNotaRemision';
import { PrellenarNotaRemisionGQL } from './graphql/prellenarNotaRemision';
import { ImprimirNotaRemisionGQL } from './graphql/imprimirNotaRemision';
import { SaveNotaRemisionGQL } from './graphql/saveNotaRemision';
import { GenerarYEnviarNotaRemisionGQL } from './graphql/generarYEnviarNotaRemision';
import { ReenviarNotaRemisionGQL } from './graphql/reenviarNotaRemision';
import { AnularNotaRemisionGQL } from './graphql/anularNotaRemision';

/**
 * Notas de remisión electrónicas.
 *
 * **Todo va contra el central** (`servidor = true`, el default de GenericCrudService): el filial no
 * emite notas, solo recibe su espejo por replicación.
 */
@Injectable({ providedIn: 'root' })
export class NotaRemisionService {

  constructor(
    private genericService: GenericCrudService,
    private notaRemisionesGQL: NotaRemisionesGQL,
    private notaRemisionGQL: NotaRemisionGQL,
    private notaRemisionItemsGQL: NotaRemisionItemsGQL,
    private notaRemisionPorTransferenciaGQL: NotaRemisionPorTransferenciaGQL,
    private documentoElectronicoGQL: DocumentoElectronicoDeNotaRemisionGQL,
    private prellenarGQL: PrellenarNotaRemisionGQL,
    private imprimirGQL: ImprimirNotaRemisionGQL,
    private saveGQL: SaveNotaRemisionGQL,
    private generarYEnviarGQL: GenerarYEnviarNotaRemisionGQL,
    private reenviarGQL: ReenviarNotaRemisionGQL,
    private anularGQL: AnularNotaRemisionGQL
  ) {}

  onGetPorFiltro(sucursalId: number, fechaInicio: string, fechaFin: string,
                 page: number, size: number): Observable<PageInfo<NotaRemision>> {
    return this.genericService.onCustomQuery(this.notaRemisionesGQL,
      { sucursalId, fechaInicio, fechaFin, page, size });
  }

  onGetPorId(id: number, sucursalId: number): Observable<NotaRemision> {
    return this.genericService.onCustomQuery(this.notaRemisionGQL, { id, sucursalId });
  }

  onGetItems(notaRemisionId: number, sucursalId: number): Observable<NotaRemisionItem[]> {
    return this.genericService.onCustomQuery(this.notaRemisionItemsGQL, { notaRemisionId, sucursalId });
  }

  /** Para deshabilitar el botón de la transferencia cuando ya tiene su nota. */
  onGetPorTransferencia(transferenciaId: number, sucursalId: number): Observable<NotaRemision> {
    return this.genericService.onCustomQuery(this.notaRemisionPorTransferenciaGQL,
      { transferenciaId, sucursalId }, true, null, true);
  }

  onGetDocumentoElectronico(notaRemisionId: number, sucursalId: number): Observable<any> {
    return this.genericService.onCustomQuery(this.documentoElectronicoGQL,
      { notaRemisionId, sucursalId }, true, null, true);
  }

  /**
   * Borrador según el origen. Los datos fiscales los calcula el central: acá solo se muestran y se
   * deja editar lo editable.
   */
  onPrellenar(origen: OrigenNotaRemision, referenciaId: number,
              sucursalId: number): Observable<NotaRemisionPrellenada> {
    return this.genericService.onCustomQuery(this.prellenarGQL, { origen, referenciaId, sucursalId });
  }

  /** PDF del KuDE en base64, para el visor del padrón de impresión. */
  onImprimir(id: number, sucursalId: number): Observable<string> {
    return this.genericService.onCustomQuery(this.imprimirGQL,
      { id, sucursalId, anchoMm: null, escpos: false });
  }

  onSave(input: NotaRemisionInput, items: NotaRemisionItemInput[]): Observable<NotaRemision> {
    return this.genericService.onCustomMutation(this.saveGQL, { input, items });
  }

  onGenerarYEnviar(id: number, sucursalId: number): Observable<any> {
    return this.genericService.onCustomMutation(this.generarYEnviarGQL, { id, sucursalId });
  }

  /** Reenvía el mismo documento: no genera otro ni consume otro número. */
  onReenviar(id: number, sucursalId: number): Observable<any> {
    return this.genericService.onCustomMutation(this.reenviarGQL, { id, sucursalId });
  }

  onAnular(id: number, sucursalId: number): Observable<NotaRemision> {
    return this.genericService.onCustomMutation(this.anularGQL, { id, sucursalId });
  }
}
