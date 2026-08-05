import { ConDesglosePeriodoGrafico } from "../utils/grafico-desglose-periodo.model";

export interface DeliverySucursalItem extends ConDesglosePeriodoGrafico {
  sucId?: number;
  nombre?: string;
  total?: number;
  /** Cantidad de deliveries concluidos en el período. */
  cantidadVentas?: number;
}
