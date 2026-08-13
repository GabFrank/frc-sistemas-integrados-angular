import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import {
  DashboardRrhhKpisGQL,
  NominaSeriePorMesGQL,
  RrhhCumpleanosDelMesGQL,
  RrhhFuncionariosIncompletosGQL,
  RrhhTopExposicionGQL,
  RrhhTopHorasExtraGQL,
} from './graphql/DashboardRrhhKpis';

/**
 * Capa de datos del dashboard de RRHH. Todas las queries usan silentLoad
 * (el dashboard maneja su propio estado de carga, sin el diálogo global).
 */
@Injectable({ providedIn: 'root' })
export class DashboardRrhhService {

  constructor(
    private genericService: GenericCrudService,
    private kpisGQL: DashboardRrhhKpisGQL,
    private serieGQL: NominaSeriePorMesGQL,
    private topExposicionGQL: RrhhTopExposicionGQL,
    private topHorasExtraGQL: RrhhTopHorasExtraGQL,
    private cumpleanosGQL: RrhhCumpleanosDelMesGQL,
    private incompletosGQL: RrhhFuncionariosIncompletosGQL
  ) { }

  onGetKpis(periodo: string): Observable<any> {
    return this.query(this.kpisGQL, { periodo });
  }

  onGetSeriePorMes(periodoInicio: string, periodoFin: string): Observable<any> {
    return this.query(this.serieGQL, { periodoInicio, periodoFin });
  }

  onGetTopExposicion(limite = 5): Observable<any> {
    return this.query(this.topExposicionGQL, { limite });
  }

  onGetTopHorasExtra(periodo: string, limite = 5): Observable<any> {
    return this.query(this.topHorasExtraGQL, { periodo, limite });
  }

  onGetCumpleanos(periodo: string): Observable<any> {
    return this.query(this.cumpleanosGQL, { periodo });
  }

  onGetFuncionariosIncompletos(page: number, size: number): Observable<any> {
    return this.query(this.incompletosGQL, { page, size });
  }

  private query(gql: any, vars: any): Observable<any> {
    return this.genericService.onCustomQuery(gql, vars, true, undefined, true);
  }
}
