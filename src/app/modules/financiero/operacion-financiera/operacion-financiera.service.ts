import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenericCrudService } from '../../../generics/generic-crud.service';
import { OperacionFinanciera, OperacionFinancieraCategoria, MovimientoBancario } from './operacion-financiera.model';
import { OperacionesFinancierasGQL } from './graphql/operacionesFinancieras';
import { OperacionFinancieraCategoriasGQL } from './graphql/operacionFinancieraCategorias';
import { RegistrarOperacionFinancieraGQL } from './graphql/registrarOperacionFinanciera';
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
    private categoriasGQL: OperacionFinancieraCategoriasGQL,
    private registrarGQL: RegistrarOperacionFinancieraGQL,
    private movimientosBancariosGQL: MovimientosBancariosGQL,
  ) { }

  onGetOperaciones(page = 0, size = 10): Observable<SimplePage<OperacionFinanciera>> {
    return this.genericService.onCustomQuery(this.operacionesGQL, { page, size });
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

  onGetMovimientosBancarios(cuentaBancariaId: number, page = 0, size = 10): Observable<SimplePage<MovimientoBancario>> {
    return this.genericService.onCustomQuery(this.movimientosBancariosGQL, { cuentaBancariaId, page, size });
  }
}
