/** El 20% que estaba clavado en el botón de aumento del cobro. */
export const TOPE_AUMENTO_DEFAULT = 20;

/** Lo que se propone al activar el tope del descuento (la opción más alta del diálogo de descuento). */
export const TOPE_DESCUENTO_DEFAULT = 15;

export class ConfiguracionCobro {
  id?: number;
  aumentoConTope?: boolean;
  aumentoTopePorcentaje?: number;
  descuentoConTope?: boolean;
  descuentoTopePorcentaje?: number;
  usuarioNickname?: string;
  modificadoEn?: Date;
}

export class ConfiguracionCobroInput {
  aumentoConTope?: boolean;
  aumentoTopePorcentaje?: number;
  descuentoConTope?: boolean;
  descuentoTopePorcentaje?: number;
}

/** Con tope salvo que la configuración diga explícitamente que no: un dato faltante nunca libera. */
function conTope(config?: ConfiguracionCobro | null): boolean {
  return config?.aumentoConTope !== false;
}

function porcentaje(config?: ConfiguracionCobro | null): number {
  const pct = config?.aumentoTopePorcentaje;
  return pct != null && pct > 0 ? pct : TOPE_AUMENTO_DEFAULT;
}

/**
 * Si el cobro puede llevar `aumentoGs` de aumento en total: la línea nueva más los aumentos que ya tiene.
 *
 * `totalGs` es el total que se cobra. `config` null o undefined (todavía cargando, filial sin la
 * configuración o sin respuesta) = con tope del 20%, lo que hacía el botón. Se compara en guaraníes
 * enteros: los cobros en USD o BRL arrastran decimales y un aumento justo en el tope no puede quedar
 * afuera por redondeo. El porcentaje tiene dos decimales (NUMERIC(6,2)): `total × pct × 100` se
 * redondea antes de cortar, porque 100.000 × 33,3 da 3.329.999,99… en punto flotante.
 */
export function aumentoPermitido(aumentoGs: number, totalGs: number, config?: ConfiguracionCobro | null): boolean {
  if (!(aumentoGs > 0)) return false;
  if (!conTope(config)) return true;
  return Math.round(aumentoGs) <= Math.floor(Math.round(totalGs * porcentaje(config) * 100) / 10000);
}

/** Lo que ya se registró como aumento en el cobro, en guaraníes (las líneas guardan `valor` negativo). */
export function aumentosRegistradosGs(lineas: { aumento?: boolean; valor?: number; cambio?: number }[]): number {
  return (lineas ?? [])
    .filter((l) => l?.aumento)
    .reduce((suma, l) => suma + Math.abs((l.valor ?? 0) * (l.cambio ?? 1)), 0);
}

export function mensajeTopeAumento(config?: ConfiguracionCobro | null): string {
  return `El aumento supera el tope del ${porcentaje(config)}% del total. ` +
    'Lo configura Tesorería en Financiero › Configuración › Cobro en PDV.';
}

// ---------------------------------------------------------------------------------------------------
// Tope del descuento. Al revés que el aumento: un dato faltante es «sin tope», que es como funcionaba el
// descuento antes de la configuración. Cuentan TODOS los descuentos del cobro (los que vienen por ítem
// desde la venta y el de F9), medidos contra el total sin descontar.
// ---------------------------------------------------------------------------------------------------

export function descuentoConTope(config?: ConfiguracionCobro | null): boolean {
  return config?.descuentoConTope === true;
}

export function porcentajeTopeDescuento(config?: ConfiguracionCobro | null): number {
  const pct = config?.descuentoTopePorcentaje;
  return pct != null && pct > 0 ? pct : TOPE_DESCUENTO_DEFAULT;
}

/**
 * El máximo descuento total del cobro, o `null` sin tope. En centésimos y redondeado antes de cortar,
 * por lo mismo que el aumento (100.000 × 33,3 da 33.299,999… en punto flotante); en centésimos y no en
 * enteros porque con otra moneda del PDV el total puede llevar decimales.
 */
export function topeDescuento(total: number, config?: ConfiguracionCobro | null): number | null {
  if (!descuentoConTope(config)) return null;
  return Math.floor(Math.round(total * porcentajeTopeDescuento(config) * 100) / 100) / 100;
}

/** Si el cobro puede llevar `descuentoTotal` de descuento en total (lo ya registrado más lo nuevo). */
export function descuentoPermitido(descuentoTotal: number, total: number, config?: ConfiguracionCobro | null): boolean {
  const tope = topeDescuento(total, config);
  if (tope == null) return true;
  return Math.round(descuentoTotal * 100) <= Math.round(tope * 100);
}

/** Lo que ya se registró como descuento en el cobro, en guaraníes (o en la moneda base con `factor`). */
export function descuentosRegistradosGs(
  lineas: { descuento?: boolean; valor?: number; cambio?: number }[],
  factor?: (l: any) => number,
): number {
  return (lineas ?? [])
    .filter((l) => l?.descuento)
    .reduce((suma, l) => suma + Math.abs((l.valor ?? 0) * (factor ? factor(l) : (l.cambio ?? 1))), 0);
}

export function mensajeTopeDescuento(config?: ConfiguracionCobro | null): string {
  return `El descuento supera el tope del ${porcentajeTopeDescuento(config)}% del total (contando los descuentos por producto). ` +
    'Lo configura Tesorería en Financiero › Configuración › Cobro en PDV.';
}
