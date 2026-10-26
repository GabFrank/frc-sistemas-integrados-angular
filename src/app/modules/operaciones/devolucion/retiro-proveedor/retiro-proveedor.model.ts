// Modelos del retiro consolidado de devoluciones por proveedor (FASE B).
// Los nombres de campos replican EXACTAMENTE el contrato GraphQL del backend.

export interface RetiroLineaConsolidada {
  productoId?: string;
  codigo?: string;
  descripcion?: string;
  presentacion?: string;
  cantidadTotal?: number;
}

// Nota: el backend tambien expone `cajas` (una fila por item) y `devoluciones`
// (cada devolucion con sus productos). El desktop no las pide: duplican la tabla
// consolidada. La PWA usa `devoluciones` para verificar por escaneo del QR de la
// etiqueta (uno por devolucion, DEV-{suc}-{id}).
export interface RetiroSucursalGrupo {
  sucursalId?: string;
  sucursalNombre?: string;
  lineas?: RetiroLineaConsolidada[];
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

export interface RetiroSucursalGrupoView {
  sucursalId?: string;
  sucursalNombre?: string;
  lineas: RetiroLineaConsolidada[];
  devoluciones: RetiroDevolucionView[];
  todasSeleccionadas: boolean;
}

export interface RetiroResultadoView {
  id: string;
  ok: boolean;
  mensaje: string;
}
