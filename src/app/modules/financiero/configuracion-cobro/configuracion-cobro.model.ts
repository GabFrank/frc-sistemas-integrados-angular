/** El 20% que estaba clavado en el botón de aumento del cobro. */
export const TOPE_AUMENTO_DEFAULT = 20;

export class ConfiguracionCobro {
  id?: number;
  aumentoConTope?: boolean;
  aumentoTopePorcentaje?: number;
  usuarioNickname?: string;
  modificadoEn?: Date;
}

export class ConfiguracionCobroInput {
  aumentoConTope?: boolean;
  aumentoTopePorcentaje?: number;
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
