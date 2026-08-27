import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { PenalizacionesPorFuncionarioYRangoGQL } from './graphql/PenalizacionesPorFuncionarioYRango';
import { PenalizacionesPageGQL } from './graphql/PenalizacionesPage';
import { SavePenalizacionGQL } from './graphql/SavePenalizacion';
import { AnularPenalizacionGQL } from './graphql/AnularPenalizacion';
import { GenerarPenalizacionesAutoRangoGQL } from './graphql/GenerarPenalizacionesAutoRango';
import { ContarAdvertenciasGQL } from './graphql/ContarAdvertencias';
import { ActaAdvertenciaGQL } from './graphql/ActaAdvertencia';
import { GenerarPenalizacionesAutoGQL } from './graphql/GenerarPenalizacionesAuto';
import { Penalizacion } from './penalizacion.model';

@Injectable({ providedIn: 'root' })
export class PenalizacionService {

  constructor(
    private genericService: GenericCrudService,
    private penalizacionesPorFuncionarioYRangoGQL: PenalizacionesPorFuncionarioYRangoGQL,
    private penalizacionesPageGQL: PenalizacionesPageGQL,
    private savePenalizacionGQL: SavePenalizacionGQL,
    private anularPenalizacionGQL: AnularPenalizacionGQL,
    private generarPenalizacionesAutoGQL: GenerarPenalizacionesAutoGQL,
    private generarPenalizacionesAutoRangoGQL: GenerarPenalizacionesAutoRangoGQL,
    private contarAdvertenciasGQL: ContarAdvertenciasGQL,
    private actaAdvertenciaGQL: ActaAdvertenciaGQL
  ) { }

  onGetPorFuncionarioYRango(funcionarioId: number, desde: string, hasta: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(
      this.penalizacionesPorFuncionarioYRangoGQL,
      { funcionarioId, desde, hasta },
      servidor
    );
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, funcionarioId?: number, desde?: string, hasta?: string,
            tipo?: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.penalizacionesPageGQL,
      { page, size, funcionarioId, desde, hasta, tipo }, servidor);
  }

  onSave(input: any, servidor = true): Observable<Penalizacion> {
    return this.genericService.onSave<Penalizacion>(this.savePenalizacionGQL, input, null, null, servidor);
  }

  onAnular(id: number, servidor = true): Observable<Penalizacion> {
    return this.genericService.onSaveCustom<Penalizacion>(this.anularPenalizacionGQL, { id }, servidor);
  }

  onGenerarAuto(fecha: string, servidor = true): Observable<number> {
    return this.genericService.onSaveCustom<number>(this.generarPenalizacionesAutoGQL, { fecha }, servidor);
  }

  /** Genera de un tiron todo un rango. Idempotente por jornada: re-correr no duplica. */
  onGenerarAutoRango(desde: string, hasta: string, servidor = true): Observable<number> {
    return this.genericService.onSaveCustom<number>(
      this.generarPenalizacionesAutoRangoGQL, { desde, hasta }, servidor);
  }

  /** Amonestaciones no anuladas del funcionario. Alimenta el chip del legajo. */
  onContarAdvertencias(funcionarioId: number, servidor = true): Observable<number> {
    return this.genericService.onCustomQuery(
      this.contarAdvertenciasGQL, { funcionarioId }, servidor, null, true);
  }

  /** Acta de amonestacion en PDF A4 (base64). No hay version ticket: lleva dos firmas. */
  onGetActaAdvertencia(id: number, servidor = true): Observable<string> {
    return this.genericService.onCustomQuery(this.actaAdvertenciaGQL, { id }, servidor);
  }
}
