import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContextoConsulta, GenericCrudService, PROPAGAR_ERROR_DE_RED } from '../../../generics/generic-crud.service';
import { TIMEOUT_POR_DEFECTO_MS } from '../../../shared/services/timeout-link';
import { OperacionFinanciera, OperacionFinancieraCategoria, MovimientoBancario } from './operacion-financiera.model';
import { OperacionesFinancierasGQL } from './graphql/operacionesFinancieras';
import { OperacionFinancieraGQL } from './graphql/operacionFinanciera';
import { OperacionFinancieraCategoriasGQL } from './graphql/operacionFinancieraCategorias';
import { RegistrarOperacionFinancieraGQL } from './graphql/registrarOperacionFinanciera';
import { AnularOperacionFinancieraGQL } from './graphql/anularOperacionFinanciera';
import { MovimientosBancariosGQL } from './graphql/movimientosBancarios';

// OJO: operacionesFinancieras/movimientosBancarios devuelven un page "simplificado"
// del backend (solo getTotalElements + getContent, sin getTotalPages/isFirst/...).
// No usar PageInfo<T> acá para no sugerir campos que la respuesta no trae.
export interface SimplePage<T> {
  getTotalElements: number;
  getContent: T[];
}

/** Listados y catálogos con un solo suscriptor por método, que maneja el error (#390). */
const CONSULTA_OPERACIONES: ContextoConsulta = { timeoutMs: TIMEOUT_POR_DEFECTO_MS, silenciarAvisoTimeout: true };

@Injectable({
  providedIn: 'root'
})
export class OperacionFinancieraService {

  constructor(
    private genericService: GenericCrudService,
    private operacionesGQL: OperacionesFinancierasGQL,
    private operacionGQL: OperacionFinancieraGQL,
    private categoriasGQL: OperacionFinancieraCategoriasGQL,
    private registrarGQL: RegistrarOperacionFinancieraGQL,
    private anularGQL: AnularOperacionFinancieraGQL,
    private movimientosBancariosGQL: MovimientosBancariosGQL,
  ) { }

  onGetOperaciones(page = 0, size = 10): Observable<SimplePage<OperacionFinanciera>> {
    return this.genericService.onCustomQuery(this.operacionesGQL, { page, size }, true, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_OPERACIONES);
  }

  /** Detalle de una operación financiera por id (para el diálogo read-only en caja mayor). */
  onGetOperacion(id: number): Observable<OperacionFinanciera> {
    return this.genericService.onCustomQuery(this.operacionGQL, { id }, true, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_OPERACIONES);
  }

  onGetCategorias(): Observable<OperacionFinancieraCategoria[]> {
    return this.genericService.onCustomQuery(this.categoriasGQL, {}, true, PROPAGAR_ERROR_DE_RED, undefined,
      CONSULTA_OPERACIONES);
  }

  onRegistrar(operacion: OperacionFinanciera, opciones?: { avisarExito?: boolean }): Observable<OperacionFinanciera> {
    let aux = operacion;
    if (!(operacion instanceof OperacionFinanciera)) {
      aux = new OperacionFinanciera();
      Object.assign(aux, operacion);
    }
    return this.genericService.onSaveCustom(this.registrarGQL, { input: aux.toInput() }, true, opciones);
  }

  /** Anula la operación financiera entera: revierte todas sus patas (caja y/o banco) en el backend. */
  onAnular(operacionId: number, motivo?: string, opciones?: { avisarExito?: boolean }): Observable<OperacionFinanciera> {
    return this.genericService.onSaveCustom(this.anularGQL, { id: operacionId, motivo: motivo || null }, true, opciones);
  }

  /** Filtros opcionales: sin ellos trae todos los movimientos de la cuenta, como antes. */
  onGetMovimientosBancarios(cuentaBancariaId: number, page = 0, size = 10,
                            filtros: { desde?: string; fin?: string; tipo?: string; soloActivos?: boolean } = {}): Observable<SimplePage<MovimientoBancario>> {
    return this.genericService.onCustomQuery(this.movimientosBancariosGQL, {
      cuentaBancariaId,
      desde: filtros.desde ?? null,
      fin: filtros.fin ?? null,
      tipo: filtros.tipo ?? null,
      soloActivos: filtros.soloActivos ?? false,
      page, size
    }, true, PROPAGAR_ERROR_DE_RED, undefined, CONSULTA_OPERACIONES);
  }
}
