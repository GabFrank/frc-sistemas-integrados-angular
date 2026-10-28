import { stringToLocalDate } from '../../../commons/core/utils/dateUtils';

export type EstadoSorteo = 'PROGRAMADO' | 'VIGENTE' | 'FINALIZADO' | 'CORTADO';

export const ESTADO_SORTEO_TEXTO: Record<EstadoSorteo, string> = {
  PROGRAMADO: 'Programado',
  VIGENTE: 'Vigente',
  FINALIZADO: 'Finalizado',
  CORTADO: 'Cortado',
};

export const MODO_SORTEO_TEXTO: Record<string, string> = {
  UNA_POR_VENTA: 'Un ticket por venta',
  POR_MULTIPLO: 'Por múltiplo del mínimo',
  CANTIDAD_FIJA: 'Cantidad fija',
};

function aDia(valor: any): number | null {
  if (valor == null || valor === '') return null;
  const d = valor instanceof Date ? valor : stringToLocalDate(String(valor));
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Mismo criterio que la filial: días inclusivos, fechas vacías = abierto. Es solo informativo: lo que
 * aplica la caja lo decide la filial con su propio "hoy" (-03).
 */
export function estadoSorteo(
  s: { activo: boolean; fechaDesde?: any; fechaHasta?: any },
  hoy: Date = new Date()
): EstadoSorteo {
  if (!s?.activo) return 'CORTADO';
  const h = aDia(hoy);
  const desde = aDia(s.fechaDesde);
  const hasta = aDia(s.fechaHasta);
  if (desde != null && desde > h) return 'PROGRAMADO';
  if (hasta != null && hasta < h) return 'FINALIZADO';
  return 'VIGENTE';
}

/** Miles con punto, sin depender del locale del runtime (250000 -> "250.000"). */
export function formatearMonto(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function plural(n: number): string {
  return n === 1 ? '1 ticket' : `${n} tickets`;
}

/** Ejemplo en vivo de cuántos tickets da una compra, para que quien carga el sorteo vea el efecto de las reglas. */
export function ayudaTickets(
  modo: string | null,
  minimo: number | null,
  cantidadFija: number | null,
  tope: number | null
): string {
  const min = Number(minimo);
  if (!(min > 0) || !modo) return '';
  switch (modo) {
    case 'UNA_POR_VENTA':
      return `Compra desde ${formatearMonto(min)} → 1 ticket`;
    case 'CANTIDAD_FIJA': {
      const n = Number(cantidadFija);
      return n >= 1 ? `Compra desde ${formatearMonto(min)} → ${plural(n)}` : '';
    }
    case 'POR_MULTIPLO': {
      const ejemplo = Math.round(min * 2.5);
      let tickets = Math.floor(ejemplo / min);
      const t = Number(tope);
      let nota = '';
      if (t >= 1) {
        tickets = Math.min(tickets, t);
        nota = ` (máximo ${t} por venta)`;
      }
      return `Compra de ${formatearMonto(ejemplo)} → ${plural(tickets)}${nota}`;
    }
    default:
      return '';
  }
}
