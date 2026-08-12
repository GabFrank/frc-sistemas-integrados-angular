// Modelos de las operaciones de devolucion (cabeceras): retiro a proveedor y
// colecta interna. Calcados del contrato GraphQL del backend `central`.

export interface OpDevolucionLinea {
  id: number;
  identificador: string;
  estado: string;
  sucursalOrigen?: { nombre: string };
}

export interface RetiroDevolucionOp {
  id: number;
  fecha: string;
  estado: string; // CONFIRMADO | REVERTIDO
  proveedor?: { id: number; persona?: { nombre: string } };
  devoluciones: OpDevolucionLinea[];
}

export interface ColectaDevolucionOp {
  id: number;
  fecha: string;
  estado: string; // CONFIRMADO | REVERTIDO
  sucursalOrigen?: { id: number; nombre: string };
  sucursalDestino?: { id: number; nombre: string };
  devoluciones: OpDevolucionLinea[];
}
