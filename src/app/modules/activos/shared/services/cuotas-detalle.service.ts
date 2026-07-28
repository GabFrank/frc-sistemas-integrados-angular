import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GenericCrudService } from '../../../../generics/generic-crud.service';
import { CalcularCuotasDetalleGQL, CalcularCuotasDetalleVariables } from '../../ente/graphql/calcularCuotasDetalle';
import { CuotaDetalle, CuotasDetalleCalculado, sanitizarCuotasDetalle } from '../models/cuota-detalle.model';

@Injectable({ providedIn: 'root' })
export class CuotasDetalleService {
  private genericService = inject(GenericCrudService);
  private calcularGQL = inject(CalcularCuotasDetalleGQL);

  calcularCuotas(params: CalcularCuotasDetalleVariables): Observable<CuotasDetalleCalculado> {
    return this.genericService.onCustomQuery(this.calcularGQL, {
      ...params,
      cuotasDetalle: sanitizarCuotasDetalle(params.cuotasDetalle),
    }).pipe(
      map(result => ({
        cuotas: sanitizarCuotasDetalle(result?.cuotas) ?? [],
        montoTotal: result?.montoTotal ?? params.montoTotal ?? 0,
      }))
    );
  }

  totalCuotas(cuotas: CuotaDetalle[]): number {
    return cuotas.reduce((acc, c) => acc + (c.monto || 0), 0);
  }
}
