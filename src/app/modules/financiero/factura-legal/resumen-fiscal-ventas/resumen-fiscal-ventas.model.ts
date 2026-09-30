/** Ventas facturadas de un mes para el contador: exentas, gravadas 5 % y 10 %. Montos gravados SIN IVA. */
export interface ResumenFiscalVentas {
  anio: number;
  mes: number;
  periodo: string;
  sucursalesFiltro: string;
  contribuyentes: ResumenFiscalContribuyente[];
}

export interface ResumenFiscalContribuyente {
  ruc: string;
  razonSocial: string;
  gravada10: number;
  iva10: number;
  gravada5: number;
  iva5: number;
  exentas: number;
  totalBase: number;
  totalIva: number;
  totalFacturado: number;
  emitidas: number;
  anuladas: number;
  detalle: ResumenFiscalTimbrado[];
}

export interface ResumenFiscalTimbrado {
  sucursalId: number;
  sucursal: string;
  timbrado: string;
  tipo: string;
  numeroDesde: string;
  numeroHasta: string;
  emitidas: number;
  anuladas: number;
  gravada10: number;
  iva10: number;
  gravada5: number;
  iva5: number;
  exentas: number;
  totalFacturado: number;
}
