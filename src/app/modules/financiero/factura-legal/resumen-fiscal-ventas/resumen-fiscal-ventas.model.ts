/** Resumen fiscal de las ventas facturadas de un mes. Montos gravados SIN IVA (como el formulario 120). */
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
  fueraDeVigencia: number;
  rubros: ResumenFiscalRubro[];
  detalle: ResumenFiscalTimbrado[];
}

export interface ResumenFiscalRubro {
  rubro: string;
  inciso: string;
  concepto: string;
  gravada10: number;
  gravada5: number;
  iva10: number;
  iva5: number;
  exentas: number;
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
  fueraDeVigencia: number;
  gravada10: number;
  iva10: number;
  gravada5: number;
  iva5: number;
  exentas: number;
  totalFacturado: number;
}
