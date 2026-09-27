import { formatDate } from '@angular/common';
import { stringToLocalDate } from '../../../commons/core/utils/dateUtils';

export type EstadoPrecioEspecial = 'VIGENTE' | 'PROGRAMADO' | 'VENCIDO' | 'CORTADO';

function soloDia(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function aDia(valor: any): number | null {
  if (valor == null || valor === '') return null;
  const d = valor instanceof Date ? valor : stringToLocalDate(String(valor));
  return soloDia(d);
}

/**
 * Mismo criterio que la filial (PrecioEspecialLector.esVigente): dias inclusivos, null abierto.
 * Es solo informativo: lo que cobra la caja lo decide la filial con su propio "hoy" (-03).
 */
export function estadoPrecioEspecial(
  e: { activo: boolean; fechaDesde?: any; fechaHasta?: any },
  hoy: Date
): EstadoPrecioEspecial {
  if (!e?.activo) return 'CORTADO';
  const h = soloDia(hoy);
  const desde = aDia(e.fechaDesde);
  const hasta = aDia(e.fechaHasta);
  if (desde != null && desde > h) return 'PROGRAMADO';
  if (hasta != null && hasta < h) return 'VENCIDO';
  return 'VIGENTE';
}

export const ESTADO_PRECIO_ESPECIAL_TEXTO: Record<EstadoPrecioEspecial, string> = {
  VIGENTE: 'Vigente',
  PROGRAMADO: 'Programado',
  VENCIDO: 'Vencido',
  CORTADO: 'Cortado',
};

/**
 * Vigencia legible. Sin fechas = "Permanente": rige hasta que se corte. Dias inclusivos.
 * Acepta "yyyy-MM-dd 00:00" (lo que manda el backend) o Date.
 */
export function textoVigencia(e: { fechaDesde?: any; fechaHasta?: any }): string {
  const f = (v: any) => {
    if (v == null || v === '') return null;
    const d = v instanceof Date ? v : stringToLocalDate(String(v));
    return formatDate(d, 'dd/MM/yyyy', 'en-US');
  };
  const desde = f(e?.fechaDesde);
  const hasta = f(e?.fechaHasta);
  if (!desde && !hasta) return 'Permanente';
  if (desde && !hasta) return `Desde el ${desde}`;
  if (!desde && hasta) return `Hasta el ${hasta}`;
  return `${desde} al ${hasta}`;
}

/** yyyy-MM-dd en hora local: toISOString correria el dia en Paraguay (UTC-3). */
export function fechaParam(d: Date | null): string | null {
  return d == null ? null : formatDate(d, 'yyyy-MM-dd', 'en-US');
}

/** null en la seleccion = "Todas" (sin la sucursal 0). Los ids llegan como string (GraphQL ID). */
export function idsSucursalesSeleccionadas(
  seleccion: ({ id: any } | null)[],
  todas: { id: any }[]
): number[] {
  const elegidas = (seleccion || []).includes(null) ? todas : (seleccion || []);
  const ids = elegidas.filter((s) => s != null).map((s) => Number(s.id)).filter((id) => id !== 0 && !isNaN(id));
  return Array.from(new Set(ids));
}
