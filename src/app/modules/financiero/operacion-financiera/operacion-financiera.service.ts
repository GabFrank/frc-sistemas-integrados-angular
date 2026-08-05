import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
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
    return this.genericService.onCustomQuery(this.operacionesGQL, { page, size });
  }

  /** Detalle de una operación financiera por id (para el diálogo read-only en caja mayor). */
  onGetOperacion(id: number): Observable<OperacionFinanciera> {
    return this.genericService.onCustomQuery(this.operacionGQL, { id });
  }

  onGetCategorias(): Observable<OperacionFinancieraCategoria[]> {
    return this.genericService.onCustomQuery(this.categoriasGQL, {});
  }

  onRegistrar(operacion: OperacionFinanciera): Observable<OperacionFinanciera> {
    let aux = operacion;
    if (!(operacion instanceof OperacionFinanciera)) {
      aux = new OperacionFinanciera();
      Object.assign(aux, operacion);
    }
    return this.genericService.onSaveCustom(this.registrarGQL, { input: aux.toInput() });
  }

  /** Anula la operación financiera entera: revierte todas sus patas (caja y/o banco) en el backend. */
  onAnular(operacionId: number, motivo?: string): Observable<OperacionFinanciera> {
    return this.genericService.onSaveCustom(this.anularGQL, { id: operacionId, motivo: motivo || null });
  }

  onGetMovimientosBancarios(cuentaBancariaId: number, page = 0, size = 10): Observable<SimplePage<MovimientoBancario>> {
    return this.genericService.onCustomQuery(this.movimientosBancariosGQL, { cuentaBancariaId, page, size });
  }
}
