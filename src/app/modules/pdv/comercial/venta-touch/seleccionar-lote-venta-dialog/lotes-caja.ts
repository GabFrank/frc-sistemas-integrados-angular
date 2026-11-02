import { StockLotePresentacion } from '../../../../operaciones/lote/lote.model';
import { VentaItemLoteInput } from '../../../../operaciones/venta/venta-item.model';

/** Qué hacer al agregar a la venta un producto con control de lote (lotes flexibles, #429). */
export type DecisionLoteCaja =
  | { tipo: 'unico'; lote: VentaItemLoteInput }
  | { tipo: 'automatico' }
  | { tipo: 'selector' };

const EPSILON = 0.0001;

/** Lotes vendibles: con id (la fila SIN LOTE no se elige) y con saldo. */
export function lotesVendibles(lotes: StockLotePresentacion[]): StockLotePresentacion[] {
  return (lotes || []).filter((l) => l?.loteId != null && (l.cantidadDisponible || 0) > EPSILON);
}

/**
 * Un solo lote vendible: se asigna sin abrir el selector (lo que no cubra lo completa el servidor).
 * Ninguno: se agrega y el servidor resuelve (FEFO / SIN LOTE). Varios: selector.
 */
export function loteUnicoParaAsignar(lotes: StockLotePresentacion[], unidades: number): DecisionLoteCaja {
  const vendibles = lotesVendibles(lotes);
  if (vendibles.length === 0) {
    return { tipo: 'automatico' };
  }
  if (vendibles.length === 1) {
    const l = vendibles[0];
    return { tipo: 'unico', lote: { loteId: l.loteId, cantidad: Math.min(l.cantidadDisponible, unidades) } };
  }
  return { tipo: 'selector' };
}

/** El lote que sale primero: retiro o vencimiento más próximo; sin fecha, al final. */
export function loteMasProximoAVencer(lotes: StockLotePresentacion[]): StockLotePresentacion | null {
  const fecha = (l: StockLotePresentacion) => {
    const f = l.fechaRetiro || l.fechaVencimiento;
    return f ? new Date(f).getTime() : Number.MAX_SAFE_INTEGER;
  };
  const vendibles = lotesVendibles(lotes);
  if (vendibles.length === 0) {
    return null;
  }
  return vendibles.reduce((a, b) => (fecha(b) < fecha(a) ? b : a));
}

/** Texto bajo el ítem antes de cobrar: "Lote X · Vto dd/mm/aa" (sin fecha, solo el número). */
export function etiquetaLote(numeroLote: string, vencimiento?: Date | string | null): string {
  const numero = numeroLote || '-';
  let vto = '';
  if (vencimiento instanceof Date || (typeof vencimiento === 'string' && /^\d{4}-\d{2}-\d{2}/.test(vencimiento))) {
    const d = new Date(vencimiento);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      vto = `${dd}/${mm}/${String(d.getUTCFullYear()).slice(-2)}`;
    }
  } else if (typeof vencimiento === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(vencimiento)) {
    vto = vencimiento.slice(0, 6) + vencimiento.slice(-2);
  }
  return vto ? `Lote ${numero} · Vto ${vto}` : `Lote ${numero}`;
}
