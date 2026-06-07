export interface EquipoFinancieroInput {
  id?: number;
  costo?: number;
  valorTasacion?: number;
  valorTasacionPyg?: number;
  valorTasacionBrl?: number;
  situacionPago?: string;
  proveedorId?: number;
  monedaId?: number;
  montoTotal?: number;
  montoYaPagado?: number;
  cantidadCuotas?: number;
  cantidadCuotasPagadas?: number;
  diaVencimiento?: number;
  usuarioId?: number;
}
