import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { VentaTouchComponent } from "./venta-touch.component";

/**
 * #716: `calcularTotales` recalcula el descuento del carrito desde cero en cada llamada, y `valorDescuento` es
 * unitario (`descuento_unitario` en el filial), como ya lo cuenta el pago. Componente sin levantar (Object.create).
 */
describe("VentaTouchComponent: calcularTotales y el descuento del carrito (#716)", () => {
  let c: any;

  function item(precio: number, cantidad: number, valorDescuento: number): VentaItem {
    const i = new VentaItem();
    i.precio = precio;
    i.cantidad = cantidad;
    i.valorDescuento = valorDescuento;
    return i;
  }

  beforeEach(() => {
    c = Object.create(VentaTouchComponent.prototype);
    c.esOtraMoneda = false;
    c.monedaPdv = null;
    c.monedas = [];
    c.monedaModulo = { empresa$: { value: null } };
    c.totalGs = 0;
    c.descuentoGs = 0;
  });

  it("no acumula el descuento entre llamadas", () => {
    c.selectedItemList = [item(1000, 1, 100), item(500, 1, 0)];
    c.calcularTotales();
    c.calcularTotales();
    c.calcularTotales();
    expect(c.totalGs).toBe(1500);
    expect(c.descuentoGs).toBe(100);
  });

  it("vuelve a 0 al quitar el ítem con descuento aunque el carrito no quede vacío", () => {
    c.selectedItemList = [item(1000, 1, 100), item(500, 1, 0)];
    c.calcularTotales();
    c.selectedItemList = [item(500, 1, 0)];
    c.calcularTotales();
    expect(c.descuentoGs).toBe(0);
  });

  it("cuenta el descuento unitario por la cantidad, como el pago", () => {
    c.selectedItemList = [item(1000, 3, 100)];
    c.calcularTotales();
    expect(c.descuentoGs).toBe(300);
  });

  it("carrito vacío: total y descuento en 0", () => {
    c.selectedItemList = [];
    c.descuentoGs = 50;
    c.calcularTotales();
    expect(c.totalGs).toBe(0);
    expect(c.descuentoGs).toBe(0);
  });
});
