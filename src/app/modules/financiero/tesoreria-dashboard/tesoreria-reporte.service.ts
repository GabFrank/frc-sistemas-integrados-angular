import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';

/** Un solo suscriptor (dashboard financiero), que maneja el error por fuente (#390). */
const CONSULTA_REPORTE: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };
import { SaldoTesoreria, VencimientoTesoreria, AgingTesoreria } from './tesoreria-reporte.model';
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
  ) { }

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
