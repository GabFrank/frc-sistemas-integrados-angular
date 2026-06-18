import { Injectable } from '@angular/core';
import { CuotaDetalle } from '../models/cuota-detalle.model';

@Injectable({ providedIn: 'root' })
export class CuotasDetalleService {
  generarCuotas(
    cantidadCuotas: number,
    cantidadCuotasPagadas: number,
    montoTotal: number,
    montoYaPagado: number,
    existentes: CuotaDetalle[] = []
  ): CuotaDetalle[] {
    const total = Math.max(0, cantidadCuotas || 0);
    if (total === 0) {
      return [];
    }

    const pagadas = Math.max(0, Math.min(cantidadCuotasPagadas || 0, total));
    const pendiente = Math.max(0, (montoTotal || 0) - (montoYaPagado || 0));
    const cuotasPendientes = Math.max(0, total - pagadas);
    const montoDefault = cuotasPendientes > 0 ? pendiente / cuotasPendientes : 0;
    const mapaExistentes = new Map(existentes.map(c => [c.numeroCuota, c]));

    const resultado: CuotaDetalle[] = [];
    for (let i = 1; i <= total; i++) {
      const previa = mapaExistentes.get(i);
      const pagado = i <= pagadas;
      resultado.push({
        numeroCuota: i,
        monto: previa?.monto ?? (pagado ? 0 : montoDefault),
        pagado,
      });
    }
    return resultado;
  }

  totalCuotas(cuotas: CuotaDetalle[]): number {
    return cuotas.reduce((acc, c) => acc + (c.monto || 0), 0);
  }
}
