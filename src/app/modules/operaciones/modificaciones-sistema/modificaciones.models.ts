/** Un cambio del historial, ya contado por el central para el personal administrativo. */
export interface HistorialCambio {
  id: number;
  fecha: string;
  usuarioId?: number;
  usuario?: string;
  categoria: string;
  /** «Cambió el precio», «Agregó un código de barras». */
  accion: string;
  /** Sobre qué: «COCA COLA 2L · UNIDAD · CONTADO · CENTRAL». */
  objeto?: string;
  observacion?: string;
  productoId?: number;
  /** Actualización registrada sin decir qué cambió (registros viejos). */
  sinDetalle: boolean;
  /** Los cambios en una línea: «Precio: 6.000 → 5.000». */
  resumen?: string;
  cambios: HistorialCambioDetalle[];
}

export interface HistorialCambioDetalle {
  campo: string;
  antes?: string;
  despues?: string;
}

export interface HistorialCambioCategoria {
  codigo: string;
  nombre: string;
}

export interface FiltrosHistorialCambios {
  fechaInicio: string;
  fechaFin: string;
  usuarioId?: number;
  productoId?: number;
  categoria?: string;
}
