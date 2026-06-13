/** Detalle de monedas dentro de una forma de pago */
export interface FormaPagoDesgloseMoneda {
  moneda: string;
  monto: number;
  montoFormateado: string;
  cantidad: number;
}

/** Detalle procesado con soporte de desglose */
export interface FormaPagoDetalleConDesglose {
  descripcion: string;
  montoFormateado: string;
  cantidadFormateada: string;
  porcentaje: number;
  color: string;
  icono: string;
  expandido: boolean;
  desglose: FormaPagoDesgloseMoneda[];
}
