import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';

/** Un solo suscriptor (dashboard financiero), que maneja el error por fuente (#390). */
const CONSULTA_REPORTE: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };
import { SaldoTesoreria, VencimientoTesoreria, AgingTesoreria, DisponibleTesoreria } from './tesoreria-reporte.model';
import { SaldoDisponibleTesoreriaGQL } from './graphql/saldoDisponibleTesoreria';
import { SaldoConsolidadoTesoreriaGQL } from './graphql/saldoConsolidadoTesoreria';
import { ProximosVencimientosTesoreriaGQL } from './graphql/proximosVencimientosTesoreria';
import { AgingCppTesoreriaGQL } from './graphql/agingCppTesoreria';

@Injectable({
  providedIn: 'root'
})
export class TesoreriaReporteService {

  constructor(
    private genericService: GenericCrudService,
    private saldoConsolidadoGQL: SaldoConsolidadoTesoreriaGQL,
    private proximosVencimientosGQL: ProximosVencimientosTesoreriaGQL,
    private agingCppGQL: AgingCppTesoreriaGQL,
    private saldoDisponibleGQL: SaldoDisponibleTesoreriaGQL,
  ) { }

  /** null si el central no lo tiene (anterior a #601) o falla: el dashboard sigue con los saldos. */
  onGetDisponible(): Observable<DisponibleTesoreria[] | null> {
    return this.saldoDisponibleGQL.fetch({}, { fetchPolicy: 'no-cache', errorPolicy: 'all', context: { clientName: 'servidor' } }).pipe(
      map(r => r?.errors?.length ? null : ((r?.data?.data || []) as DisponibleTesoreria[])),
      catchError(() => of(null)));
  }

  onGetSaldoConsolidado(): Observable<SaldoTesoreria[]> {
    return this.genericService.onCustomQuery(this.saldoConsolidadoGQL, {}, true, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_REPORTE);
  }

  onGetProximosVencimientos(dias: number = 30): Observable<VencimientoTesoreria[]> {
    return this.genericService.onCustomQuery(this.proximosVencimientosGQL, { dias }, true, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_REPORTE);
  }

  onGetAgingCpp(): Observable<AgingTesoreria> {
    return this.genericService.onCustomQuery(this.agingCppGQL, {}, true, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_REPORTE);
  }
}
