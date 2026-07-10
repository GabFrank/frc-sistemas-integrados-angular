// Modelos del dashboard de devoluciones. Los nombres de campos replican el
// contrato GraphQL del backend (devolucion-dashboard.graphqls).

export interface ResumenDevoluciones {
  total?: number;
  conProveedor?: number;
  sinProveedor?: number;
  pendientesRetiro?: number;
  valorTotal?: number;
  valorMerma?: number;
}

export interface DevolucionPorEstado {
  estado?: string;
  cantidad?: number;
}

export interface TopProductoDevuelto {
  productoId?: string;
  descripcion?: string;
  cantidad?: number;
  valor?: number;
}

export interface TopMotivoDevolucion {
  motivoId?: string;
  descripcion?: string;
  items?: number;
  cantidad?: number;
}

export interface DevolucionSeriePunto {
  fecha?: string;
  cantidad?: number;
  valor?: number;
}

export interface DevolucionEstancada {
  devolucionId?: string;
  identificador?: string;
  producto?: string;
  sucursal?: string;
  estado?: string;
  fecha?: string;
  dias?: number;
}
