import { Usuario } from "../../personas/usuarios/usuario.model";

/** El 20% que estaba clavado en el botón de aumento del cobro. */
export const TOPE_AUMENTO_DEFAULT = 20;

export class ConfiguracionCobro {
  id?: number;
  aumentoConTope?: boolean;
  aumentoTopePorcentaje?: number;
  usuario?: Usuario;
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
 * Si el cobro puede registrar como aumento lo que se pagó de más.
 *
 * `saldoGs` es el saldo del cobro en guaraníes (negativo = se pagó de más) y `totalGs` el total que se
 * cobra. `config` null o undefined (todavía cargando, filial sin la configuración o sin respuesta) =
 * con tope del 20%, lo que hacía el botón. Se compara en guaraníes enteros: el saldo arrastra decimales
 * de los cobros en USD o BRL y un aumento justo en el tope no puede quedar afuera por redondeo.
 */
export function aumentoPermitido(saldoGs: number, totalGs: number, config?: ConfiguracionCobro | null): boolean {
  if (!(saldoGs < 0)) return false;
  if (!conTope(config)) return true;
  return Math.round(-saldoGs) <= Math.floor((totalGs * porcentaje(config)) / 100);
}

export function mensajeTopeAumento(config?: ConfiguracionCobro | null): string {
  return `El aumento supera el tope del ${porcentaje(config)}% del total. ` +
    'Lo configura Tesorería en Financiero › Configuración › Cobro en PDV.';
}
