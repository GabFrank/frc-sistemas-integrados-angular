import { ROLES } from '../../personas/roles/roles.enum';
import { LoteVentaItem } from './lote.model';

/**
 * Lotes de una venta (#429 fase 2, entrega 2): lo que comparten las listas de ventas para mostrar
 * de qué lote salió cada ítem.
 */

/** VER PRODUCTOS y además análisis de caja o de venta (ADMIN siempre), igual que el central. */
export function puedeVerLotesDeVenta(roles: string[]): boolean {
  roles = roles || [];
  return roles.includes(ROLES.ADMIN) || (roles.includes(ROLES.VER_PRODUCTOS)
    && (roles.includes(ROLES.ANALISIS_DE_CAJA) || roles.includes(ROLES.ANALISIS_DE_VENTA)));
}

/** Filas del central agrupadas por ítem de venta. */
export function agruparLotesPorItem(filas: LoteVentaItem[]): { [ventaItemId: string]: LoteVentaItem[] } {
  const mapa: { [id: string]: LoteVentaItem[] } = {};
  for (const f of filas || []) {
    const k = String(f.ventaItemId);
    (mapa[k] = mapa[k] || []).push(f);
  }
  return mapa;
}

/** «Lote X · Vto dd/mm/aa»; con varios lotes, cada uno con sus unidades. Nulo si no hay filas. */
export function textoLotesDeItem(filas: LoteVentaItem[]): string {
  if (!filas?.length) return null;
  const una = filas.length === 1;
  return filas.map(f => {
    let t = f.loteId == null ? 'SIN LOTE' : 'Lote ' + f.numeroLote;
    if (f.loteId != null && f.fechaVencimiento) {
      const [a, m, d] = String(f.fechaVencimiento).substring(0, 10).split('-');
      t += ' · Vto ' + d + '/' + m + '/' + a.substring(2);
    }
    if (!una) t += ' (' + (Math.round(f.cantidad * 100) / 100) + ' u.)';
    if (f.anulado) t += ' (anulado)';
    return t;
  }).join(' · ');
}
