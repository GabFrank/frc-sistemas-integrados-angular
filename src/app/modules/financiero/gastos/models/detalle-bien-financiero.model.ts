export interface DetalleBienFinanciero {
  descripcion?: string;
  identificador?: string;
  nombreAsignado?: string;
  direccion?: string;
  chapa?: string;
  modelo?: { descripcion: string };
  proveedor?: { nombre: string };
  montoTotal?: number;
  montoYaPagado?: number;
  cantidadCuotas?: number;
  cantidadCuotasPagadas?: number;
  diaVencimiento?: number;
  moneda?: { simbolo: string };
  situacionPago?: string;
}
