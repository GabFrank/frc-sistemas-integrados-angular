import { FormaPagoDesgloseMoneda } from "./forma-pago-desglose.model";

export interface FormaPagoDetalleProcesado {
  descripcion: string;
  montoFormateado: string;
  cantidadFormateada: string;
  porcentaje: number;
  color: string;
  icono: string;
  expandido: boolean;
  desglose: FormaPagoDesgloseMoneda[];
}
