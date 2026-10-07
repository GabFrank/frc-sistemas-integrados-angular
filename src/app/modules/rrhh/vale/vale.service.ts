import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { ValesPorFuncionarioGQL } from './graphql/ValesPorFuncionario';
import { ValesPorEstadoGQL } from './graphql/ValesPorEstado';
import { ValesPageGQL } from './graphql/ValesPage';
import { SaveValeGQL } from './graphql/SaveVale';
import { ConfirmarValeGQL } from './graphql/ConfirmarVale';
import { AnularValeGQL } from './graphql/AnularVale';
import { CrearValeConfirmadoGQL } from './graphql/CrearValeConfirmado';
import { CrearValeEnEspecieGQL } from './graphql/CrearValeEnEspecie';
import { ValeCuotasGQL } from './graphql/ValeCuotas';
import { Vale } from './vale.model';

@Injectable({ providedIn: 'root' })
export class ValeService {

  constructor(
    private genericService: GenericCrudService,
    private valesPorFuncionarioGQL: ValesPorFuncionarioGQL,
    private valesPorEstadoGQL: ValesPorEstadoGQL,
    private valesPageGQL: ValesPageGQL,
    private saveValeGQL: SaveValeGQL,
    private confirmarValeGQL: ConfirmarValeGQL,
    private anularValeGQL: AnularValeGQL,
    private crearValeConfirmadoGQL: CrearValeConfirmadoGQL,
    private crearValeEnEspecieGQL: CrearValeEnEspecieGQL,
    private valeCuotasGQL: ValeCuotasGQL
  ) { }

  /** Vale entregado en bienes (ej. uniforme): nace confirmado, sin egreso de caja. */
  onCrearEnEspecie(input: any, autorizadoPorId?: number, servidor = true): Observable<Vale> {
    return this.genericService.onSaveCustom<Vale>(this.crearValeEnEspecieGQL,
      { entity: input, autorizadoPorId: autorizadoPorId || null }, servidor);
  }

  onGetCuotas(valeId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.valeCuotasGQL, { valeId }, servidor, PROPAGAR_ERROR_DE_RED, undefined,
      { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true });
  }

  /** Crea y confirma el vale en un paso, egresando de la caja mayor (origen RRHH_VALE). */
  onCrearConfirmado(input: any, cajaVirtualId: number, autorizadoPorId?: number, servidor = true): Observable<Vale> {
    return this.genericService.onSaveCustom<Vale>(this.crearValeConfirmadoGQL,
      { entity: input, cajaVirtualId, autorizadoPorId: autorizadoPorId || null }, servidor);
  }

  onGetPorFuncionario(funcionarioId: number, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.valesPorFuncionarioGQL, { funcionarioId }, servidor,
      PROPAGAR_ERROR_DE_RED, undefined, { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true });
  }

  onGetPorEstado(estado: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.valesPorEstadoGQL, { estado }, servidor);
  }

  /** Padron del SaaS: lista paginada y filtrada en el backend. */
  onGetPage(page: number, size: number, funcionarioId?: number, estado?: string,
            desde?: string, hasta?: string, servidor = true): Observable<any> {
    return this.genericService.onCustomQuery(this.valesPageGQL,
      { page, size, funcionarioId, estado, desde, hasta }, servidor);
  }

  onSave(input: any, servidor = true): Observable<Vale> {
    return this.genericService.onSave<Vale>(this.saveValeGQL, input, null, null, servidor);
  }

  onConfirmar(id: number, cajaVirtualId: number, autorizadoPorId: number, servidor = true): Observable<Vale> {
    return this.genericService.onSaveCustom<Vale>(this.confirmarValeGQL, { id, cajaVirtualId, autorizadoPorId }, servidor);
  }

  onAnular(id: number, servidor = true): Observable<Vale> {
    return this.genericService.onSaveCustom<Vale>(this.anularValeGQL, { id }, servidor);
  }
}
