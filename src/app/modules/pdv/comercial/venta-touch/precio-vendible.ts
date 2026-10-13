import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { PrecioPorSucursal } from "../../../productos/precio-por-sucursal/precio-por-sucursal.model";

/**
 * ¿Se puede vender a este precio? Un precio en cero no es un regalo: el PDV no tiene regalos ni
 * bonificaciones, así que es un error de carga del catálogo. Esa venta saldría gratis y sin factura,
 * porque el documento electrónico exige precio unitario mayor a cero (#473).
 */
export function tienePrecioVendible(precio: PrecioPorSucursal): boolean {
  if (precio?.precio == null) return false;
  const valor = Number(precio.precio);
  return isFinite(valor) && valor > 0;
}

/**
 * El primer ítem del carrito con precio en cero o negativo, o null. Es para los ítems que no pasaron
 * por `addItem` (venta recuperada, delivery abierto). Un precio que no vino en la consulta no cuenta:
 * frenar el cobro por un dato que falta sería peor.
 */
export function itemConPrecioEnCero(items: VentaItem[]): VentaItem {
  return (
    (items ?? []).find((item) => {
      // `item.precio` es lo que se cobra (calcularTotales) y lo único que trae un delivery recuperado;
      // el precio del catálogo pudo cambiar después de cargado el ítem.
      const precio = item?.precio ?? item?.precioVenta?.precio;
      return typeof precio === "number" && isFinite(precio) && precio <= 0;
    }) ?? null
  );
}
