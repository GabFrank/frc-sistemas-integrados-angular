import { ConDesglosePeriodoGrafico } from "../../utils/grafico-desglose-periodo.model";

export interface VentaFuncionarioItem extends ConDesglosePeriodoGrafico {
  id?: number;
  funcionario?: string;
  total?: number;
  cantidad?: number;
  productoMasVendido?: string;
  sucursales?: string;
}
