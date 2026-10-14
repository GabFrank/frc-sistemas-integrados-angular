/**
 * ¿Se puede guardar este precio de venta? Tiene que ser un número de 1 o más: un precio en cero deja
 * al producto saliendo gratis y sin factura en el PDV (#473). La excepción es editar un precio viejo
 * que ya estaba así sin cambiarle el valor, para poder inactivarlo o corregirle el tipo.
 */
export function esPrecioGuardable(precioNuevo: any, precioGuardado?: any): boolean {
  if (precioNuevo == null || precioNuevo === "") return false;
  const nuevo = Number(precioNuevo);
  if (!isFinite(nuevo)) return false;
  if (nuevo >= 1) return true;
  return precioGuardado != null && precioGuardado !== "" && Number(precioGuardado) === nuevo;
}
