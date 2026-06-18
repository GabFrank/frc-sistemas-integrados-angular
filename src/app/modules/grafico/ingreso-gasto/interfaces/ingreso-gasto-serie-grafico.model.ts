import { IngresoGastoMesAcumulado } from "../../venta-mes/interfaces/ingreso-gasto-mes-acumulado.model";

export interface IngresoGastoSerieGrafico {
  anio: number;
  sucId?: number | string | null;
  sucursalNombre?: string;
  ingresos: IngresoGastoMesAcumulado[];
  gastos: IngresoGastoMesAcumulado[];
}
