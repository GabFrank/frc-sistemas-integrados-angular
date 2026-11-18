import { of } from "rxjs";
import { PagoTouchComponent } from "./pago-touch.component";

/**
 * #718: el cobro de un delivery en la moneda del PDV usa la cotización de su venta, no la del día. Pasa por
 * `setPrecios` con servicios de mentira (componente sin levantar, Object.create).
 */
describe("PagoTouchComponent: cobro de delivery con la cotización de su venta (#718)", () => {
  const GS = { id: 1, denominacion: "GUARANI", cambio: 1, decimales: 0 };
  const USD = Object.freeze({ id: 3, denominacion: "DOLAR", cambio: 6500, decimales: 2 });
  const RS = { id: 2, denominacion: "REAL", cambio: 1200, decimales: 2 };
  let c: any;

  function abrir(venta: any, monedas: any[] = [GS, USD, RS], empresa: any = null): void {
    c = Object.create(PagoTouchComponent.prototype);
    c.data = { valor: 5.61, delivery: { venta }, monedaBase: { id: 3 } };
    c.valorParcialPagado = 0;
    c.currencyOptionsGuarani = { precision: 0 };
    c.currencyOptionsNoGuarani = { precision: 2 };
    c.monedaModulo = { empresa$: { value: empresa } };
    c.monedasService = { onGetAll: () => of(monedas), decimalesDeMoneda: (m: any) => m?.decimales ?? 0 };
    const control = () => ({ setValue: () => {}, value: 0 });
    c.formGroup = { controls: { moneda: control(), valor: control(), saldo: control() } };
    c.setPrecios();
  }

  it("la moneda del PDV toma la cotización de la venta: cambio de cada línea y factores", () => {
    abrir({ id: 80141, monedaId: 3, cotizacion: 6450 });
    expect(c.monedaBase.cambio).toBe(6450);
    expect(c.selectedMoneda.cambio).toBe(6450);
    expect(c.cambioDs).toBe(6450);
    // Un cobro en Gs se convierte por la cotización de la venta: 5,61 US$ = 36.184,5 Gs.
    expect(5.61 / c.factorGs).toBeCloseTo(36184.5, 6);
    expect(c.factorRs).toBeCloseTo(1200 / 6450, 12);
  });

  it("no toca el objeto original ni las otras monedas", () => {
    abrir({ id: 80141, monedaId: 3, cotizacion: 6450 });
    expect(USD.cambio).toBe(6500);
    expect(c.monedas.find((m: any) => m.id === 2)).toBe(RS);
  });

  it("cotización y monedaId como texto (BigDecimal / ID de GraphQL)", () => {
    abrir({ id: 80141, monedaId: "3", cotizacion: "6450" });
    expect(c.monedaBase.cambio).toBe(6450);
  });

  it("con empresa de cambio distinto de 1: el inverso de cotizacionEmpresa", () => {
    const empresa = { id: 9, denominacion: "OTRA", cambio: 2 };
    abrir({ id: 80141, monedaId: 3, cotizacion: 3225 }, [GS, USD, empresa], empresa);
    expect(c.monedaBase.cambio).toBe(6450);
  });

  it("sin cotización en la venta, de otra moneda o sin delivery: el cambio del día", () => {
    abrir({ id: 80141, monedaId: 3 });
    expect(c.monedaBase.cambio).toBe(6500);
    abrir({ id: 80141, monedaId: 2, cotizacion: 6450 });
    expect(c.monedaBase.cambio).toBe(6500);
    abrir({ id: 80141, monedaId: 3, cotizacion: 0 });
    expect(c.monedaBase.cambio).toBe(6500);
    abrir(undefined);
    expect(c.monedaBase.cambio).toBe(6500);
  });
});
