/**
 * Plan de cheques en cuotas (desk #708): un solo lugar para la regla, que usan el pago desde la caja mayor
 * (`pagar-compras-dialog`) y la emisión sin compra (`emitir-cheque-dialog`).
 *
 * N cheques de `total / N` redondeado a los decimales de la moneda; el último lleva el resto para que la suma dé
 * exactamente el total. Las fechas de pago se encadenan cada `intervaloDias` desde la primera.
 */
export interface CuotaPlan {
  /** Posición, desde 0. */
  indice: number;
  monto: number;
  fechaPago: Date;
}

export const CUOTAS_OPCIONES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const INTERVALOS_DIAS = [7, 15, 30, 45];

/** Mitad lejos del cero, como el resto del módulo financiero (`Math.round(-0.5)` da -0). */
export function redondearMonto(valor: number, decimales: number): number {
  const f = Math.pow(10, decimales);
  const v = valor || 0;
  return Math.sign(v) * Math.round(Math.abs(v) * f) / f || 0;
}

export function sumarDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

export function armarCuotas(total: number, cuotas: number, primeraFecha: Date, intervaloDias: number,
                            decimales: number): CuotaPlan[] {
  const n = Math.max(1, Math.min(12, Math.floor(cuotas || 1)));
  const cuota = redondearMonto(total / n, decimales);
  const out: CuotaPlan[] = [];
  for (let i = 0; i < n; i++) {
    const monto = i === n - 1 ? redondearMonto(total - cuota * (n - 1), decimales) : cuota;
    out.push({ indice: i, monto, fechaPago: sumarDias(primeraFecha, n > 1 ? i * intervaloDias : 0) });
  }
  return out;
}
