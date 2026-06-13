import { ConDesglosePeriodoGrafico } from "../../utils/grafico-desglose-periodo.model";

export interface GastoCategoriaItem extends ConDesglosePeriodoGrafico {
  categoria?: string;
  total: number;
  cantidad?: number;
}
