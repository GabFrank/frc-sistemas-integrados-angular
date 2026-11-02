import { InfoPendienteLote } from '../lote.model';

const EPS = 0.0001;

/** Qué impide confirmar el completado (null = se puede). Misma regla que valida el central. */
export function motivoNoConfirmar(info: InfoPendienteLote | null, numeroLote: string, cantidad: number | null,
                                  cerrarRemanente: boolean, motivoRemanente: string): string | null {
  if (!info) return 'Cargando...';
  if (info.sincronizacionVencida) {
    return 'La sucursal no sincroniza con el central hace más de ' + info.maxDesfaseMinutos
      + ' minutos: puede haber ventas sin lote que todavía no llegaron.';
  }
  if (!numeroLote || !numeroLote.trim()) return 'Falta el número de lote.';
  if (cantidad == null || !(cantidad > EPS)) return 'La cantidad tiene que ser mayor a cero.';
  if (cantidad - info.pendiente.remanente > EPS) return 'Es más de lo pendiente de esta recepción.';
  if (cantidad - info.saldoSinLote > EPS) return 'Es más que el SIN LOTE disponible en la sucursal.';
  if (cerrarRemanente && restante(info, cantidad) > EPS && !(motivoRemanente || '').trim()) {
    return 'Falta el motivo de lo que no se atribuye.';
  }
  return null;
}

/** Lo que queda de la recepción después de atribuir esa cantidad. */
export function restante(info: InfoPendienteLote, cantidad: number | null): number {
  const r = info.pendiente.remanente - (cantidad || 0);
  return r > EPS ? r : 0;
}

/** El central avisa así que el lote ya existe con otro vencimiento y hay que confirmar. */
export function esVencimientoDistinto(error: any): boolean {
  const texto = typeof error === 'string' ? error : JSON.stringify(error ?? '');
  return texto.includes('VENCIMIENTO_DISTINTO');
}
