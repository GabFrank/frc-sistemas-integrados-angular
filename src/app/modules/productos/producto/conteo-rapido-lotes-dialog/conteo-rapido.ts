import { AjusteStockLoteInput, ModoAjusteLote } from '../../../operaciones/lote/lote.model';

export const TOPE_CONTEO_RAPIDO = 50;

export interface FilaConteo {
  loteId: number;
  numeroLote: string;
  fechaVencimiento?: string;
  /** Saldo del lote en la sucursal al cargar la pantalla. */
  saldo: number;
  /** Lo contado. null = no se contó: la fila no viaja. */
  contado: number | null;
}

/** Arma los ajustes del conteo rápido: solo filas contadas y con diferencia, con saldoEsperado. */
export function construirConteoRapido(
  filas: FilaConteo[],
  base: { productoId: number; sucursalId: number; modo: ModoAjusteLote; motivo?: string; usuarioId?: number }
): AjusteStockLoteInput[] {
  return (filas || [])
    .filter((f) => f.contado != null && (f.contado as any) !== '' && !isNaN(Number(f.contado)))
    .filter((f) => Number(f.contado) !== f.saldo)
    .map((f) => ({
      productoId: base.productoId,
      sucursalId: base.sucursalId,
      modo: base.modo,
      cantidadFinal: Number(f.contado),
      motivo: base.motivo?.trim() || undefined,
      usuarioId: base.usuarioId,
      loteId: f.loteId,
      saldoEsperado: f.saldo
    }));
}
