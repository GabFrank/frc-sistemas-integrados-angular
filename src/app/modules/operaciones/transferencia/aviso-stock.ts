/**
 * Qué hacer al cargar un ítem de transferencia según el stock del origen.
 *
 * - stock positivo: sigue.
 * - stock 0: aviso con confirmación.
 * - stock negativo: bloquea, salvo que la configuración de transferencias lo permita; en ese
 *   caso, aviso con confirmación.
 *
 * Lo que se confirma queda registrado por el central en el control de stock negativo.
 *
 * La sucursal COMPRAS queda fuera del aviso y del registro: su stock es negativo por diseño (la
 * mercadería "nace" ahí al cargar la compra). Conserva la regla de siempre: el negativo se bloquea
 * o pasa según la configuración, sin preguntar.
 */
export type DecisionAvisoStock = "SEGUIR" | "CONFIRMAR" | "BLOQUEAR";

export function decidirAvisoStock(
  stock: number,
  permitirNegativo: boolean,
  origenCompras: boolean
): DecisionAvisoStock {
  if (stock > 0) return "SEGUIR";
  if (origenCompras) return stock < 0 && !permitirNegativo ? "BLOQUEAR" : "SEGUIR";
  if (stock === 0) return "CONFIRMAR";
  return permitirNegativo ? "CONFIRMAR" : "BLOQUEAR";
}

/** La configuración solo hace falta para decidir un negativo: el 0 no la consulta. */
export function necesitaConfiguracion(stock: number): boolean {
  return stock < 0;
}
