export interface CuotaDetalle {
  numeroCuota: number;
  monto: number;
  pagado?: boolean;
}

export function sanitizarCuotasDetalle(cuotas?: CuotaDetalle[]): CuotaDetalle[] | undefined {
  if (!cuotas?.length) {
    return undefined;
  }
  return cuotas.map(({ numeroCuota, monto, pagado }) => ({
    numeroCuota,
    monto,
    pagado,
  }));
}

export interface CuotasDetalleCalculado {
  cuotas: CuotaDetalle[];
  montoTotal: number;
}
