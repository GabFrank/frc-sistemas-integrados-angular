import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { Cheque, ChequeInput, ChequeResumenDia, ChequeSaldoChequera, ChequeDashboardFiltro } from './cheque.model';
import { GetChequeGQL } from './graphql/getCheque';
import { GetChequesGQL } from './graphql/getCheques';
import { GetChequesSearchGQL } from './graphql/getChequesSearch';
import { GetChequesPorChequeraIdGQL } from './graphql/getChequesPorChequeraId';
import { GetChequePorPagoDetalleCuotaIdGQL } from './graphql/getChequePorPagoDetalleCuotaId';
import { GetCountChequeGQL } from './graphql/getCountCheque';
import { SaveChequeGQL } from './graphql/saveCheque';
import { DeleteChequeGQL } from './graphql/deleteCheque';
import { GetChequesDashboardGQL } from './graphql/getChequesDashboard';
import { GetChequesResumenPorDiaGQL } from './graphql/getChequesResumenPorDia';
import { GetChequesSaldosPorChequeraGQL } from './graphql/getChequesSaldosPorChequera';
import { CobrarChequeGQL } from './graphql/cobrarCheque';
import { AnularChequeGQL } from './graphql/anularCheque';
import { EmitirChequeGQL } from './graphql/emitirCheque';

@Injectable({
  providedIn: 'root'
})
export class ChequeService {

  constructor(
    private genericService: GenericCrudService,
    private getChequeGQL: GetChequeGQL,
    private getChequesGQL: GetChequesGQL,
    private getChequesSearchGQL: GetChequesSearchGQL,
    private getChequesPorChequeraIdGQL: GetChequesPorChequeraIdGQL,
    private getChequePorPagoDetalleCuotaIdGQL: GetChequePorPagoDetalleCuotaIdGQL,
    private getCountChequeGQL: GetCountChequeGQL,
    private saveChequeGQL: SaveChequeGQL,
    private deleteChequeGQL: DeleteChequeGQL,
    private getChequesDashboardGQL: GetChequesDashboardGQL,
    private getChequesResumenPorDiaGQL: GetChequesResumenPorDiaGQL,
    private getChequesSaldosPorChequeraGQL: GetChequesSaldosPorChequeraGQL,
    private cobrarChequeGQL: CobrarChequeGQL,
    private anularChequeGQL: AnularChequeGQL,
    private emitirChequeGQL: EmitirChequeGQL
  ) { }

  /**
   * Obtiene un cheque por su ID
   * @param id ID del cheque
   * @returns Observable de Cheque
   */
  onGetCheque(id: number): Observable<Cheque> {
    return this.genericService.onGetById(this.getChequeGQL, id);
  }

  /**
   * Obtiene todos los cheques con paginación
   * @param page Número de página
   * @param size Tamaño de página
   * @returns Observable de lista de Cheques
   */
  onGetCheques(page: number = 0, size: number = 10): Observable<Cheque[]> {
    return this.genericService.onGetAll(this.getChequesGQL, page, size);
  }

  /**
   * Busca cheques por texto
   * @param texto Texto para búsqueda
   * @returns Observable de lista de Cheques
   */
  onSearchCheques(texto: string): Observable<Cheque[]> {
    return this.genericService.onCustomQuery(this.getChequesSearchGQL, { texto });
  }

  /**
   * Obtiene cheques por ID de chequera
   * @param chequeraId ID de la chequera
   * @returns Observable de lista de Cheques
   */
  onGetChequesPorChequeraId(chequeraId: number): Observable<Cheque[]> {
    return this.genericService.onCustomQuery(this.getChequesPorChequeraIdGQL, { chequeraId });
  }

  /**
   * Obtiene un cheque por ID de cuota de detalle de pago
   * @param pagoDetalleCuotaId ID de la cuota de detalle de pago
   * @returns Observable de Cheque
   */
  onGetChequePorPagoDetalleCuotaId(pagoDetalleCuotaId: number): Observable<Cheque> {
    return this.genericService.onGetById(this.getChequePorPagoDetalleCuotaIdGQL, pagoDetalleCuotaId);
  }

  /**
   * Obtiene el conteo total de cheques
   * @returns Observable con el número total de cheques
   */
  onCountCheques(): Observable<number> {
    return this.genericService.onCustomQuery(this.getCountChequeGQL, {});
  }

  /**
   * Guarda o actualiza un cheque
   * @param entity Datos del cheque a guardar
   * @returns Observable del Cheque guardado
   */
  onSaveCheque(entity: ChequeInput): Observable<Cheque> {
    return this.genericService.onSave(this.saveChequeGQL, { entity });
  }

  /**
   * Elimina un cheque por su ID
   * @param id ID del cheque a eliminar
   * @returns Observable booleano indicando si se eliminó correctamente
   */
  onDeleteCheque(id: number): Observable<boolean> {
    return this.genericService.onDelete(this.deleteChequeGQL, id, 'Cheque');
  }

  // ── Dashboard de cheques (todo por fecha de pago) ──

  /** Lista de cheques por fecha de pago en el rango, con filtros opcionales. */
  onGetChequesDashboard(f: ChequeDashboardFiltro): Observable<Cheque[]> {
    return this.getChequesDashboardGQL
      .fetch(this.filtroVars(f), { fetchPolicy: 'network-only' })
      .pipe(map(res => res?.data?.data || []));
  }

  /** Total y cantidad de cheques a pagar por día (gráfico + KPI por fecha). */
  onGetResumenPorDia(f: ChequeDashboardFiltro): Observable<ChequeResumenDia[]> {
    return this.getChequesResumenPorDiaGQL
      .fetch(this.filtroVars(f), { fetchPolicy: 'network-only' })
      .pipe(map(res => res?.data?.data || []));
  }

  /** Saldos/compromiso por chequera activa hasta la fecha (cards del sidebar). */
  onGetSaldosPorChequera(hasta: string, estado?: string | null): Observable<ChequeSaldoChequera[]> {
    return this.getChequesSaldosPorChequeraGQL
      .fetch({ hasta, estado: estado || null }, { fetchPolicy: 'network-only' })
      .pipe(map(res => res?.data?.data || []));
  }

  /** Cobra un cheque diferido (debita el banco y libera la reserva). */
  onCobrar(chequeId: number): Observable<Cheque> {
    return this.cobrarChequeGQL
      .mutate({ chequeId })
      .pipe(map(res => res?.data?.data));
  }

  /** Anula un cheque (libera reserva o revierte el débito). */
  onAnular(chequeId: number, motivo: string): Observable<Cheque> {
    return this.anularChequeGQL
      .mutate({ chequeId, motivo })
      .pipe(map(res => res?.data?.data));
  }

  /** Emite un cheque suelto (no ligado a un pago CPP). */
  onEmitirManual(vars: {
    chequeraId: number; total: number; diferido: boolean;
    monedaId?: number; cuentaBancariaId?: number; fechaPago?: string; concepto?: string;
  }): Observable<Cheque> {
    return this.emitirChequeGQL
      .mutate(vars)
      .pipe(map(res => res?.data?.data));
  }

  private filtroVars(f: ChequeDashboardFiltro) {
    return {
      desde: f.desde,
      hasta: f.hasta,
      cuentaBancariaId: f.cuentaBancariaId || null,
      chequeraId: f.chequeraId || null,
      estado: f.estado || null,
    };
  }
} 