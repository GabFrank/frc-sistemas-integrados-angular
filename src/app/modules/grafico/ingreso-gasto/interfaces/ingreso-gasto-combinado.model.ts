/** Datos combinados de ingresos y gastos por sucursal/año */
export interface IngresoGastoCombinado {
  sucursalId: number | null;
  sucursalNombre: string;
  anho: number;
  ingresos: IngresoGastoMesDetalle[];
  gastos: IngresoGastoMesDetalle[];
}

/** Detalle mensual con desglose por forma de pago */
export interface IngresoGastoMesDetalle {
  mes: number;
  total: number;
  efvo?: number;
  tarjeta?: number;
  otros?: number;
  cantidad?: number;
}
