import { Venta } from "../../../operaciones/venta/venta.model";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { aplicarMonedaALaVenta, ContextoMonedaPdv, ventaDeEmpresaAMonedaPdv } from "./moneda-pdv-guardado";

const PYG: any = { id: 1, cambio: 1, decimales: 0 };
const USD: any = { id: 3, cambio: 6100, decimales: 2 };
const contexto: ContextoMonedaPdv = { monedaPdv: USD, empresa: PYG, cot: 6100, cambioRs: null, cambioDs: 6100 };

function ventaConUnItem(precio: number): Venta {
  const venta = new Venta();
  const item = new VentaItem();
  item.cantidad = 2;
  item.precio = precio;
  item.valorDescuento = 0;
  venta.ventaItemList = [item];
  venta.totalGs = 2 * precio;
  return venta;
}

describe("moneda-pdv-guardado", () => {
  it("lleva la venta a la moneda de la empresa y deja la del PDV aparte", () => {
    const venta = ventaConUnItem(5.85);
    aplicarMonedaALaVenta(venta, contexto);
    expect(venta.totalMoneda).toBe(11.7);
    expect(venta.totalGs).toBe(71370);
    expect(venta.monedaId).toBe(3);
    expect(venta.cotizacion).toBe(6100);
    expect(venta.ventaItemList[0].precio).toBe(35685);
    expect(venta.ventaItemList[0].precioEnMoneda).toBe(5.85);
  });

  it("leida del filial vuelve a la moneda del PDV con las mismas cifras", () => {
    const venta = ventaConUnItem(35685);
    ventaDeEmpresaAMonedaPdv(venta, USD, 6100);
    expect(venta.ventaItemList[0].precio).toBe(5.85);
    expect(venta.valorTotal).toBe(11.7);
    expect(venta.cotizacion).toBe(6100);
  });
});
