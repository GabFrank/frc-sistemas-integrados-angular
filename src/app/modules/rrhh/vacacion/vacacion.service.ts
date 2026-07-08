import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { VacacionesPorFuncionarioGQL } from './graphql/VacacionesPorFuncionario';
import { VacacionPeriodosGQL } from './graphql/VacacionPeriodos';
import { VacacionVentasGQL } from './graphql/VacacionVentas';
import { DevengarVacacionGQL } from './graphql/DevengarVacacion';
import { ProgramarPeriodoGQL } from './graphql/ProgramarPeriodo';
import { AprobarPeriodoGQL } from './graphql/AprobarPeriodo';
import { MarcarGozadaGQL } from './graphql/MarcarGozada';
import { VenderDiasGQL } from './graphql/VenderDias';

@Injectable({ providedIn: 'root' })
export class VacacionService {

  constructor(
    private genericService: GenericCrudService,
    private vacacionesPorFuncionarioGQL: VacacionesPorFuncionarioGQL,
    private vacacionPeriodosGQL: VacacionPeriodosGQL,
    private vacacionVentasGQL: VacacionVentasGQL,
    private devengarVacacionGQL: DevengarVacacionGQL,
    private programarPeriodoGQL: ProgramarPeriodoGQL,
    private aprobarPeriodoGQL: AprobarPeriodoGQL,
    private marcarGozadaGQL: MarcarGozadaGQL,
    private venderDiasGQL: VenderDiasGQL
  ) { }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.vacacionesPorFuncionarioGQL, { funcionarioId }, servidor);
  }

  onGetPeriodos(vacacionId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.vacacionPeriodosGQL, { vacacionId }, servidor);
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
