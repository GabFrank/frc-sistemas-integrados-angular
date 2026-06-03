import { ConDesglosePeriodoGrafico } from "../utils/grafico-desglose-periodo.model";

export interface VentaCiudadItem extends ConDesglosePeriodoGrafico {
  ciudadId?: number;
  nombre?: string;
  total?: number;
}
