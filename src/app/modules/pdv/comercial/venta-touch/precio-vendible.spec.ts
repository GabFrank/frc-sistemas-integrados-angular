import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { PrecioPorSucursal } from "../../../productos/precio-por-sucursal/precio-por-sucursal.model";
import { itemConPrecioEnCero, tienePrecioVendible } from "./precio-vendible";

function precio(valor: any): PrecioPorSucursal {
  return { id: 1, precio: valor } as PrecioPorSucursal;
}

function item(precioVenta: any, precioItem?: any): VentaItem {
  return { precioVenta: precioVenta === undefined ? undefined : precio(precioVenta), precio: precioItem } as VentaItem;
}

describe("tienePrecioVendible", () => {
  it("acepta un precio mayor a cero", () => {
    expect(tienePrecioVendible(precio(1))).toBeTrue();
    expect(tienePrecioVendible(precio(65000))).toBeTrue();
    expect(tienePrecioVendible(precio(0.5))).toBeTrue();
  });

  it("rechaza cero, negativos y lo que no es un precio", () => {
    expect(tienePrecioVendible(precio(0))).toBeFalse();
    expect(tienePrecioVendible(precio(-100))).toBeFalse();
    expect(tienePrecioVendible(precio(null))).toBeFalse();
    expect(tienePrecioVendible(precio(undefined))).toBeFalse();
    expect(tienePrecioVendible(precio(NaN))).toBeFalse();
    expect(tienePrecioVendible(precio("abc"))).toBeFalse();
    expect(tienePrecioVendible(precio(""))).toBeFalse();
    expect(tienePrecioVendible(null)).toBeFalse();
    expect(tienePrecioVendible(undefined)).toBeFalse();
  });
});

describe("itemConPrecioEnCero", () => {
  it("no encuentra nada en un carrito con precios válidos o vacío", () => {
    expect(itemConPrecioEnCero([item(5000), item(250)])).toBeNull();
    expect(itemConPrecioEnCero([])).toBeNull();
    expect(itemConPrecioEnCero(null)).toBeNull();
  });

  it("devuelve el ítem cuyo precio es cero o negativo", () => {
    const enCero = item(0);
    expect(itemConPrecioEnCero([item(5000), enCero])).toBe(enCero);
    const negativo = item(-1);
    expect(itemConPrecioEnCero([negativo])).toBe(negativo);
  });

  it("mira el precio del ítem cuando no vino el precio de venta", () => {
    const enCero = item(undefined, 0);
    expect(itemConPrecioEnCero([enCero])).toBe(enCero);
    expect(itemConPrecioEnCero([item(undefined, 5000)])).toBeNull();
  });

  it("un ítem sin ningún precio cargado no frena el cobro", () => {
    expect(itemConPrecioEnCero([item(undefined, undefined), item(undefined, null)])).toBeNull();
  });
});
