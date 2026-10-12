import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { LiquidacionesFinalesPorFuncionarioGQL } from './graphql/LiquidacionesFinalesPorFuncionario';
import { LiquidacionFinalItemsGQL } from './graphql/LiquidacionFinalItems';
import { GenerarLiquidacionFinalGQL } from './graphql/GenerarLiquidacionFinal';
import { AprobarLiquidacionFinalGQL } from './graphql/AprobarLiquidacionFinal';
import { VolverBorradorLiquidacionFinalGQL } from './graphql/VolverBorradorLiquidacionFinal';
import { PagarLiquidacionFinalGQL } from './graphql/PagarLiquidacionFinal';
import { AnularLiquidacionFinalGQL } from './graphql/AnularLiquidacionFinal';
import { ImprimirReciboFinalGQL } from './graphql/ImprimirReciboFinal';
import { ImprimirReciboItemLiquidacionFinalGQL } from './graphql/ImprimirReciboItemLiquidacionFinal';
import { PreviewLiquidacionFinalGQL } from './graphql/PreviewLiquidacionFinal';
import { AgregarItemLiquidacionFinalGQL } from './graphql/AgregarItemLiquidacionFinal';
import { EditarItemLiquidacionFinalGQL } from './graphql/EditarItemLiquidacionFinal';
import { EliminarItemLiquidacionFinalGQL } from './graphql/EliminarItemLiquidacionFinal';

/**
 * Consultas que deciden si se ofrece generar un finiquito o se habilita «Generar»: sin esto, con
 * el central sin responder no emiten nada y quien llama no puede distinguirlo de «no hay» (#390).
 */
const CONSULTA_FINIQUITO: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };

@Injectable({ providedIn: 'root' })
export class LiquidacionFinalService {

  constructor(
    private genericService: GenericCrudService,
    private porFuncionarioGQL: LiquidacionesFinalesPorFuncionarioGQL,
    private itemsGQL: LiquidacionFinalItemsGQL,
    private generarGQL: GenerarLiquidacionFinalGQL,
    private aprobarGQL: AprobarLiquidacionFinalGQL,
    private volverBorradorGQL: VolverBorradorLiquidacionFinalGQL,
    private pagarGQL: PagarLiquidacionFinalGQL,
    private anularGQL: AnularLiquidacionFinalGQL,
    private imprimirReciboFinalGQL: ImprimirReciboFinalGQL,
    private agregarItemGQL: AgregarItemLiquidacionFinalGQL,
    private editarItemGQL: EditarItemLiquidacionFinalGQL,
    private eliminarItemGQL: EliminarItemLiquidacionFinalGQL,
    private previewGQL: PreviewLiquidacionFinalGQL,
    private imprimirReciboItemGQL: ImprimirReciboItemLiquidacionFinalGQL
  ) { }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.porFuncionarioGQL, { funcionarioId }, servidor, PROPAGAR_ERROR_DE_RED,
      undefined, CONSULTA_FINIQUITO);
  }

  onGetItems(liquidacionFinalId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.itemsGQL, { liquidacionFinalId }, servidor);
  }

  onGenerar(input: any, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.generarGQL, { input }, servidor);
  }

  onPreview(funcionarioId: number, fechaEgreso: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.previewGQL, { funcionarioId, fechaEgreso }, servidor,
      PROPAGAR_ERROR_DE_RED, undefined, CONSULTA_FINIQUITO);
  }

  onAprobar(id: number, aprobadoPorId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.aprobarGQL, { id, aprobadoPorId }, servidor);
  }

  onVolverBorrador(id: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.volverBorradorGQL, { id }, servidor);
  }

  onPagar(id: number, cajaVirtualId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.pagarGQL, { id, cajaVirtualId }, servidor);
  }

  onAnular(id: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.anularGQL, { id }, servidor);
  }

  onImprimirRecibo(id: number, anchoMm: number | null = null, escpos = false, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.imprimirReciboFinalGQL, { id, anchoMm, escpos }, servidor);
  }

  /** Recibo de un solo item del finiquito (HABER: recibo; DESCUENTO: constancia). No en ANULADA. */
  onImprimirReciboItem(itemId: number, anchoMm: number | null = null, escpos = false, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.imprimirReciboItemGQL, { itemId, anchoMm, escpos }, servidor);
  }

  onAgregarItem(liquidacionFinalId: number, descripcion: string, monto: number, tipo: string, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.agregarItemGQL, { liquidacionFinalId, descripcion, monto, tipo }, servidor);
  }

  onEditarItem(itemId: number, descripcion: string, monto: number, tipo: string, usuarioId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.editarItemGQL, { itemId, descripcion, monto, tipo, usuarioId }, servidor);
  }

  onEliminarItem(itemId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.eliminarItemGQL, { itemId }, servidor);
  }
}
