import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Cobro } from "../../../operaciones/venta/cobro/cobro.model";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { Venta } from "../../../operaciones/venta/venta.model";
import { cotizacionEmpresa, equivalenteEmpresa, redondearEnMoneda } from "./moneda-pdv.util";

/**
 * Pasos de guardado de una venta cuando el PDV opera en una moneda distinta de la de la empresa (Fase 4).
 * Los comparten la venta normal y el delivery. Solo se usan con otra moneda del PDV: con la de la empresa
 * nadie las llama y las claves nuevas (`monedaId`, `cotizacion`, `totalMoneda`, `precioEnMoneda`) no viajan.
 */

/** Lo que hace falta para llevar una venta a la moneda de la empresa. */
export interface ContextoMonedaPdv {
  /** La moneda del PDV (con su cambio y decimales). */
  monedaPdv: Moneda;
  /** La moneda de la empresa (principal). */
  empresa: Moneda;
  /** Unidades de la empresa por 1 unidad de la moneda del PDV. */
  cot: number;
  cambioRs?: number | null;
  cambioDs?: number | null;
}

/**
 * Lleva a la moneda de la empresa lo que la venta guarda ahí (`totalGs`, `precio`, `valorDescuento`) y deja la
 * moneda del PDV en `monedaId` / `cotizacion` / `totalMoneda` / `precioEnMoneda`. Espera `venta.totalGs` y los
 * `precio` / `valorDescuento` de los ítems en la moneda del PDV. Los ítems se copian: el carrito no cambia si el
 * guardado falla y se reintenta.
 */
export function aplicarMonedaALaVenta(venta: Venta, c: ContextoMonedaPdv): void {
  const aEmpresa = (monto: number) => equivalenteEmpresa(monto, c.cot, c.empresa?.decimales ?? 0);
  const totalBase = venta.totalGs;
  venta.monedaId = Number(c.monedaPdv.id);
  venta.cotizacion = c.cot;
  venta.totalMoneda = redondearEnMoneda(totalBase, c.monedaPdv);
  venta.totalGs = aEmpresa(totalBase);
  // totalRs / totalDs: la fórmula de siempre, sobre el total en la moneda de la empresa.
  venta.totalRs = c.cambioRs ? venta.totalGs / c.cambioRs : null;
  venta.totalDs = c.cambioDs ? venta.totalGs / c.cambioDs : null;
  venta.ventaItemList = (venta.ventaItemList || []).map((original) => itemAEmpresa(original, c));
}

/** Copia del ítem con el precio y el descuento en la moneda de la empresa y el precio de la moneda del PDV aparte. */
export function itemAEmpresa(original: VentaItem, c: ContextoMonedaPdv): VentaItem {
  const aEmpresa = (monto: number) => equivalenteEmpresa(monto, c.cot, c.empresa?.decimales ?? 0);
  const item = Object.assign(new VentaItem(), original);
  item.precioEnMoneda = original.precio;
  item.precio = aEmpresa(+original.precio);
  if (original.valorDescuento != null && isFinite(+original.valorDescuento)) {
    item.valorDescuento = aEmpresa(+original.valorDescuento);
  }
  return item;
}

/** Lleva el total del cobro (hoy en la moneda del PDV) a la moneda de la empresa y deja la cotización de cada línea. */
export function aplicarMonedaAlCobro(cobro: Cobro, c: ContextoMonedaPdv): void {
  const aEmpresa = (monto: number) => equivalenteEmpresa(monto, c.cot, c.empresa?.decimales ?? 0);
  // El total del cobro sale de restar lineas: sin redondear quedaba 3.1500000000000004.
  cobro.totalMoneda = redondearEnMoneda(cobro.totalGs, c.monedaPdv);
  cobro.totalGs = aEmpresa(cobro.totalMoneda);
  completarCotizacionDeLineas(cobro, c.empresa);
}

/** Cada línea del cobro lleva la cotización de su moneda (unidades de la empresa por unidad). */
export function completarCotizacionDeLineas(cobro: Cobro, empresa: Moneda | null): void {
  (cobro.cobroDetalleList || []).forEach((cd) => {
    const cot = cotizacionEmpresa(cd.moneda, empresa);
    if (cot != null) cd.cotizacion = cot;
  });
}

/**
 * Venta leída del filial -> moneda del PDV, en el lugar. El filial guarda `precio` y `valorDescuento` en la moneda
 * de la empresa (el equivalente); el PDV trabaja en la suya: se divide por la cotización de la venta y se redondea a
 * los decimales de la moneda del PDV. Deja `valorTotal` como lo calcula el PDV (suma de cantidad × precio por ítem,
 * sin descuento) y la moneda de la venta en `monedaId` / `cotizacion` / `totalMoneda`, para que lo que se vuelva a
 * guardar de ella conserve su moneda.
 */
export function ventaDeEmpresaAMonedaPdv(venta: Venta, monedaPdv: Moneda, cotizacion: number): void {
  let total = 0;
  (venta.ventaItemList || []).forEach((item) => {
    item.precio = redondearEnMoneda(+item.precio / cotizacion, monedaPdv);
    if (item.valorDescuento != null && isFinite(+item.valorDescuento)) {
      item.valorDescuento = redondearEnMoneda(+item.valorDescuento / cotizacion, monedaPdv);
    }
    total += redondearEnMoneda(+item.cantidad * +item.precio, monedaPdv);
  });
  venta.valorTotal = total;
  venta.monedaId = Number(monedaPdv.id);
  venta.cotizacion = cotizacion;
  venta.totalMoneda = total;
}
