import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { VacacionesPorFuncionarioGQL } from './graphql/VacacionesPorFuncionario';
import { VacacionesPageGQL } from './graphql/VacacionesPage';
import { VacacionPeriodosGQL } from './graphql/VacacionPeriodos';
import { VacacionVentasGQL } from './graphql/VacacionVentas';
import { DevengarVacacionGQL } from './graphql/DevengarVacacion';
import { ProgramarPeriodoGQL } from './graphql/ProgramarPeriodo';
import { AprobarPeriodoGQL } from './graphql/AprobarPeriodo';
import { MarcarGozadaGQL } from './graphql/MarcarGozada';
import { VenderDiasGQL } from './graphql/VenderDias';
import { AprobarVentaVacacionGQL, AnularVentaVacacionGQL } from './graphql/VentaVacacionAcciones';

@Injectable({ providedIn: 'root' })
export class VacacionService {

  constructor(
    private genericService: GenericCrudService,
    private vacacionesPorFuncionarioGQL: VacacionesPorFuncionarioGQL,
    private vacacionesPageGQL: VacacionesPageGQL,
    private vacacionPeriodosGQL: VacacionPeriodosGQL,
    private vacacionVentasGQL: VacacionVentasGQL,
    private devengarVacacionGQL: DevengarVacacionGQL,
    private programarPeriodoGQL: ProgramarPeriodoGQL,
    private aprobarPeriodoGQL: AprobarPeriodoGQL,
    private marcarGozadaGQL: MarcarGozadaGQL,
    private venderDiasGQL: VenderDiasGQL,
    private aprobarVentaVacacionGQL: AprobarVentaVacacionGQL,
    private anularVentaVacacionGQL: AnularVentaVacacionGQL
  ) { }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.vacacionesPorFuncionarioGQL, { funcionarioId }, servidor);
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, funcionarioId?: number, anio?: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.vacacionesPageGQL, { page, size, funcionarioId, anio }, servidor);
  }

  onGetPeriodos(vacacionId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.vacacionPeriodosGQL, { vacacionId }, servidor);
  }

  onAprobarVenta(ventaId: number, autorizadoPorId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.aprobarVentaVacacionGQL, { ventaId, autorizadoPorId }, servidor);
  }

  onAnularVenta(ventaId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.anularVentaVacacionGQL, { ventaId }, servidor);
  }

  onGetVentas(vacacionId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.vacacionVentasGQL, { vacacionId }, servidor);
  }

  onDevengar(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.devengarVacacionGQL, { funcionarioId }, servidor);
  }

  onProgramarPeriodo(vacacionId: number, desde: string, hasta: string, estado: string, observacion: string, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.programarPeriodoGQL, { vacacionId, desde, hasta, estado, observacion }, servidor);
  }

  onAprobarPeriodo(periodoId: number, autorizadoPorId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.aprobarPeriodoGQL, { periodoId, autorizadoPorId }, servidor);
  }

  onMarcarGozada(periodoId: number, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.marcarGozadaGQL, { periodoId }, servidor);
  }

  onVenderDias(vacacionId: number, dias: number, observacion: string, servidor = true): Observable<any> {
    return this.genericService.onSaveCustom<any>(this.venderDiasGQL, { vacacionId, dias, observacion }, servidor);
  }
}
