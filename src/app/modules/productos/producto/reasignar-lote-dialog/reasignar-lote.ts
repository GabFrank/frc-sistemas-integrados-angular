/** Lógica pura de «Pasar a otro lote» (lotes fase 3, entrega 2), separada para probarla sin Angular. */
export interface LoteConSaldo {
  loteId: number;
  numeroLote: string;
  saldo: number;
}

export interface ReasignarLoteInput {
  productoId: number;
  sucursalId: number;
  loteOrigenId: number;
  loteDestinoId: number;
  cantidad: number;
  motivo: string;
  referencia?: string;
  saldoEsperado?: number;
  forzar?: boolean;
  usuarioId?: number;
}

export interface FormReasignar {
  origen: LoteConSaldo | null;
  destinoId: number | null;
  cantidad: number | string | null;
  motivo: string;
}

/** Devuelve el error a mostrar o null si se puede guardar. */
export function errorReasignar(f: FormReasignar): string | null {
  if (!f.origen) {
    return 'Elegí el lote de origen.';
  }
  if (f.destinoId == null) {
    return 'Elegí el lote de destino.';
  }
  if (f.destinoId === f.origen.loteId) {
    return 'El origen y el destino son el mismo lote.';
  }
  const cantidad = f.cantidad == null || f.cantidad === '' ? NaN : Number(f.cantidad);
  if (!(cantidad > 0)) {
    return 'La cantidad tiene que ser mayor a cero.';
  }
  if (cantidad > f.origen.saldo + 0.0001) {
    return `El lote ${f.origen.numeroLote} tiene ${f.origen.saldo} en esta sucursal.`;
  }
  if (!f.motivo?.trim()) {
    return 'El motivo es obligatorio.';
  }
  return null;
}

export function construirReasignar(
  f: FormReasignar,
  base: { productoId: number; sucursalId: number; usuarioId?: number; referencia?: string; forzar?: boolean }
): ReasignarLoteInput {
  return {
    productoId: base.productoId,
    sucursalId: base.sucursalId,
    loteOrigenId: f.origen.loteId,
    loteDestinoId: f.destinoId,
    cantidad: Number(f.cantidad),
    motivo: f.motivo.trim(),
    referencia: base.referencia?.trim() || null,
    saldoEsperado: f.origen.saldo,
    forzar: base.forzar === true,
    usuarioId: base.usuarioId
  };
}
