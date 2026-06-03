import { ConDesglosePeriodoGrafico } from "../utils/grafico-desglose-periodo.model";

export interface VentaSucursalItem extends ConDesglosePeriodoGrafico {
  sucId?: number;
  nombre?: string;
  total?: number;
}
