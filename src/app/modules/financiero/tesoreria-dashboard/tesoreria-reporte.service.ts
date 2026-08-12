import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
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
    return this.genericService.onCustomQuery(this.saldoConsolidadoGQL, {});
  }

  onGetProximosVencimientos(dias: number = 30): Observable<VencimientoTesoreria[]> {
    return this.genericService.onCustomQuery(this.proximosVencimientosGQL, { dias });
  }

  onGetAgingCpp(): Observable<AgingTesoreria> {
    return this.genericService.onCustomQuery(this.agingCppGQL, {});
  }
}
