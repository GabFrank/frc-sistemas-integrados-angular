/**
 * Acepta coma o punto como decimal: el cajero tipea lo que ve en el papel, y el OCR devuelve lo
 * que el papel imprime.
 *
 * ⚠️ Antes quitaba TODOS los puntos, y el comentario decía lo mismo que ahora. Con guaraníes no se
 * notaba (`918.957` es 918957), pero el cupón de PlugPay imprime `USD 146.50`: el OCR lo leía bien,
 * el formulario lo mostraba bien, y se guardaba 14650. Medido el 2026-09-24 con los tickets de
 * FARMACIA FRANCO SUC1. Desde el formato no tenía arreglo: el patrón sólo recorta el texto, y con
 * `escala` el valor llega como número (146.5) y salía 1465.
 *
 * La regla, de lo más seguro a lo menos:
 * - número: se deja como está. Lo es lo cobrado (`data.monto`), que también pasa por acá para
 *   la comparación: un cobro de USD 146.5 se volvía 1465 y el cruce en dólares estaba roto de
 *   los dos lados. Y lo es el valor del extractor cuando el mapeo trae `escala`.
 * - punto y coma: el que queda último es el decimal (`1.500,50`, y `1,146.50` si un proveedor
 *   imprime en inglés un importe de más de mil).
 * - sólo coma: una es decimal (`146,50`, como siempre); varias son miles.
 * - sólo puntos: un punto final seguido de 1 o 2 dígitos es decimal (`146.50`). Los miles siempre
 *   agrupan de a tres, así que `918.957` y `1.500` siguen siendo miles, igual que antes.
 */
export function aNumero(v: any): number {
  if (typeof v === 'number') return isFinite(v) ? v : undefined;
  if (v == null || String(v).trim() === '') return undefined;
  let s = String(v).trim();
  const coma = s.lastIndexOf(',');
  const punto = s.lastIndexOf('.');
  if (coma >= 0 && punto >= 0) {
    const decimal = coma > punto ? ',' : '.';
    const miles = decimal === ',' ? '.' : ',';
    s = s.split(miles).join('').replace(decimal, '.');
  } else if (coma >= 0) {
    s = s.split(',').length > 2 ? s.split(',').join('') : s.replace(',', '.');
  } else if (/\.\d{1,2}$/.test(s)) {
    s = s.slice(0, punto).split('.').join('') + '.' + s.slice(punto + 1);
  } else {
    s = s.split('.').join('');
  }
  const n = Number(s);
  return isNaN(n) ? undefined : n;
}
