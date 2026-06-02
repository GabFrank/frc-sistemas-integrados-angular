import { FormaPagoMonedaDesglose } from "./forma-pago-moneda-desglose.model";

export interface FormaPagoEstadistica {
  formaPagoId: number;
  descripcion: string;
  cantidadTransacciones: number;
  totalMonto: number;
  porcentaje: number;
  desgloseMoneda?: FormaPagoMonedaDesglose[];
}
