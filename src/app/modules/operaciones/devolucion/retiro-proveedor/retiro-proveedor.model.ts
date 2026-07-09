// Modelos del retiro consolidado de devoluciones por proveedor (FASE B).
// Los nombres de campos replican EXACTAMENTE el contrato GraphQL del backend.

export interface RetiroLineaConsolidada {
  productoId?: string;
  codigo?: string;
  descripcion?: string;
  presentacion?: string;
  cantidadTotal?: number;
}

export interface RetiroCaja {
  identificador?: string;
  devolucionId?: string;
  productoId?: string;
  descripcion?: string;
  cantidad?: number;
  lote?: string;
  vencimiento?: string;
}

export interface RetiroSucursalGrupo {
  sucursalId?: string;
  sucursalNombre?: string;
  lineas?: RetiroLineaConsolidada[];
  cajas?: RetiroCaja[];
  devolucionIds?: string[];
}

export interface RetiroProveedorConsolidado {
  proveedorId?: string;
  proveedorNombre?: string;
  fecha?: string;
  grupos?: RetiroSucursalGrupo[];
}

export interface RetiroDevolucionResultado {
  id?: string;
  ok?: boolean;
  mensaje?: string;
}

export interface RetiroBloqueResultado {
  resultados?: RetiroDevolucionResultado[];
}

// ===== View models (solo cliente) =====
// Se precalculan en el .ts para no llamar funciones desde el HTML.

export interface RetiroDevolucionView {
  id: string;
  seleccionado: boolean;
}

export interface RetiroCajaView extends RetiroCaja {
  seleccionado: boolean;
}

export interface RetiroSucursalGrupoView {
  sucursalId?: string;
  sucursalNombre?: string;
  lineas: RetiroLineaConsolidada[];
  cajas: RetiroCajaView[];
  devoluciones: RetiroDevolucionView[];
  todasSeleccionadas: boolean;
}

export interface RetiroResultadoView {
  id: string;
  ok: boolean;
  mensaje: string;
}
