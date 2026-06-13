import { ConDesglosePeriodoGrafico } from "../../utils/grafico-desglose-periodo.model";
import { FormaPagoMonedaDesglose } from "./forma-pago-moneda-desglose.model";

export interface FormaPagoEstadistica extends ConDesglosePeriodoGrafico {
  formaPagoId: number;
  descripcion: string;
  cantidadTransacciones: number;
  totalMonto: number;
  porcentaje: number;
  desgloseMoneda?: FormaPagoMonedaDesglose[];
}
