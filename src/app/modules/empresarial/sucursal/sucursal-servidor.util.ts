import { Sucursal } from './sucursal.model';

/**
 * Sucursal del servidor (id 0). No es un local: es donde viven los gastos pagados desde la caja
 * mayor (tesoreria), que no pertenecen a ninguna filial. Se muestra con su nombre real,
 * SERVIDOR — "CENTRAL" no sirve como etiqueta porque SUC. CENTRAL es una filial de verdad.
 */
export const SUCURSAL_SERVIDOR_ID = 0;

/** Sucursal de compras, que no es un local y nunca va en estos filtros. */
const SUCURSAL_COMPRAS_ID = 999;

/**
 * `Sucursal.id` es `ID!` en el schema, asi que GraphQL lo serializa como **string**: sin esto
 * `s.id === 0` y `s.id > 0` son los dos false para el servidor y la sucursal 0 desaparece.
 */
function idNumerico(sucursal: Sucursal): number {
  return Number(sucursal?.id);
}

/**
 * Lista de sucursales para los filtros de **gastos**, con el servidor al principio.
 *
 * El resto de los filtros del sistema esconde la sucursal 0 a proposito (no vende, no tiene caja).
 * En gastos si corresponde: los gastos de la caja mayor se registran ahi.
 */
export function sucursalesConServidor(sucursales: Sucursal[]): Sucursal[] {
  const lista = (sucursales || []).filter(
    (s) => s.activo && idNumerico(s) !== SUCURSAL_COMPRAS_ID
  );
  const servidor = lista.filter((s) => idNumerico(s) === SUCURSAL_SERVIDOR_ID);
  const filiales = lista.filter((s) => idNumerico(s) > SUCURSAL_SERVIDOR_ID);
  return [...servidor, ...filiales];
}
