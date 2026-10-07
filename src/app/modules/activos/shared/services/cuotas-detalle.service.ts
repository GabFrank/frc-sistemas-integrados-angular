import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContextoConsulta, GenericCrudService, QueryError } from '../../../../generics/generic-crud.service';
import { TIMEOUT_CONSULTA_DE_FONDO_MS } from '../../../../generics/generic-crud.constantes';
import { CalcularCuotasDetalleGQL, CalcularCuotasDetalleVariables } from '../../ente/graphql/calcularCuotasDetalle';
import { CuotaDetalle, CuotasDetalleCalculado, sanitizarCuotasDetalle } from '../models/cuota-detalle.model';

/** El cálculo propaga el error de red y el del servidor, sin aviso ni modal: el editor muestra su propio estado. */
const LECTURA_CALCULO: QueryError = {
  networkError: { propagate: true, show: false },
  graphError: { propagate: true, show: false },
};
const CONSULTA_CALCULO: ContextoConsulta = { timeoutMs: TIMEOUT_CONSULTA_DE_FONDO_MS, silenciarAvisoTimeout: true };

@Injectable({ providedIn: 'root' })
export class CuotasDetalleService {
  private genericService = inject(GenericCrudService);
  private calcularGQL = inject(CalcularCuotasDetalleGQL);

  /**
   * Plan de cuotas calculado por el central. Si el cálculo falla, el observable da ERROR: antes un fallo se
   * convertía en un plan vacío con el monto tipeado, que el editor entregaba al formulario como válido (#390).
   * El central nunca devuelve `null` cuando sale bien (sin cuotas devuelve una lista vacía).
   */
  calcularCuotas(params: CalcularCuotasDetalleVariables): Observable<CuotasDetalleCalculado> {
    return this.genericService.onCustomQuery(this.calcularGQL, {
      ...params,
      cuotasDetalle: sanitizarCuotasDetalle(params.cuotasDetalle),
    }, true, LECTURA_CALCULO, true, CONSULTA_CALCULO).pipe(
      map(result => {
        if (result == null) throw new Error('El cálculo de cuotas no devolvió resultado');
        return {
          cuotas: sanitizarCuotasDetalle(result.cuotas) ?? [],
          montoTotal: result.montoTotal ?? params.montoTotal ?? 0,
        };
      })
    );
  }

  totalCuotas(cuotas: CuotaDetalle[]): number {
    return cuotas.reduce((acc, c) => acc + (c.monto || 0), 0);
  }
}
