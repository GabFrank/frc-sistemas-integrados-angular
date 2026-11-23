import { of } from "rxjs";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { VentaTouchComponent } from "./venta-touch.component";

/**
 * #730: el cobro rápido (F8 / F11) arma la línea de descuento del cobro con `valorDescuento`, que es unitario
 * (`descuento_unitario` en el filial): va por la cantidad, como en el pago y en `calcularTotales`.
 * Componente sin levantar (Object.create); se captura el cobro que llega a `onSaveVenta`.
 */
describe("VentaTouchComponent: descuento del cobro rápido (#730)", () => {
  let c: any;
  let cobro: any;
  let venta: any;

  function item(precio: number, cantidad: number, valorDescuento: number): VentaItem {
    const i = new VentaItem();
    i.precio = precio;
    i.cantidad = cantidad;
    i.valorDescuento = valorDescuento;
    return i;
  }

  beforeEach(() => {
    cobro = null;
    c = Object.create(VentaTouchComponent.prototype);
    c.pdvSinValidar = () => false;
    c.carritoConPrecioEnCero = () => false;
    c.monedaDeCobro = () => ({ id: 1 });
    c.monedas = [{ id: 1, denominacion: "GUARANI", cambio: 1 }];
    c.esOtraMoneda = false;
    c.formaPagoList = [{ descripcion: "EFECTIVO" }];
    c.formaPagoService = { formaPagoList: [{ descripcion: "EFECTIVO" }] };
    c.cajaService = { selectedCaja: null };
    c.buscadorFocusSub = { next: () => {} };
    c.onSaveVenta = (ventaArmada, cobroArmado) => {
      venta = ventaArmada;
      cobro = cobroArmado;
      return of(null);
    };
  });

  it("la línea de descuento es el descuento unitario por la cantidad y el pago es el neto, como en pago-touch", () => {
    c.selectedItemList = [item(1000, 3, 100), item(500, 2, 0)];
    c.totalGs = 4000; // bruto, como lo deja calcularTotales
    c.cobrarTicket(false);
    const desc = cobro.cobroDetalleList.filter((d) => d.descuento);
    const pago = cobro.cobroDetalleList.filter((d) => d.pago);
    expect(desc.length).toBe(1);
    expect(desc[0].valor).toBe(300);
    expect(pago.length).toBe(1);
    expect(pago[0].valor).toBe(3700);
    // Como onPagoClick: el cobro neto del descuento; la venta queda en el bruto.
    expect(cobro.totalGs).toBe(3700);
    expect(venta.totalGs).toBe(4000);
  });

  it("un descuento indefinido no deja el pago en NaN", () => {
    const i = item(1000, 2, 0);
    i.valorDescuento = undefined;
    c.selectedItemList = [i];
    c.totalGs = 2000;
    c.cobrarTicket(false);
    expect(cobro.cobroDetalleList.some((d) => d.descuento)).toBe(false);
    expect(cobro.cobroDetalleList.find((d) => d.pago).valor).toBe(2000);
    expect(cobro.totalGs).toBe(2000);
  });

  it("sin descuento no agrega la línea y el pago es el total", () => {
    c.selectedItemList = [item(1000, 3, 0)];
    c.totalGs = 3000;
    c.cobrarTicket(false);
    expect(cobro.cobroDetalleList.some((d) => d.descuento)).toBe(false);
    expect(cobro.cobroDetalleList.find((d) => d.pago).valor).toBe(3000);
  });
});
