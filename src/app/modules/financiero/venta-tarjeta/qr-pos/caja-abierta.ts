/**
 * Si la caja cuenta como abierta.
 *
 * Por `activo`, no por `estado`: `pdv_caja.estado` no lo escribe nadie y está vacío en todas las
 * cajas (farmacia filial 1 y alpha, 2026-09-24). Comparar contra `EN_PROCESO` daba siempre caja
 * cerrada. Es el mismo criterio que usa el filial para la captura del cupón y para el maletín.
 */
export function cajaEstaAbierta(caja: { activo?: boolean } | null | undefined): boolean {
  return caja?.activo === true;
}
