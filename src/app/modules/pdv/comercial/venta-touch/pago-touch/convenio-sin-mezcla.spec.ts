import { PagoTouchComponent } from "./pago-touch.component";

/**
 * El convenio paga toda la venta y sin descuento: con cualquier línea ya cargada (otra forma de pago o un
 * descuento, de F9 o precargado) no se abre el diálogo de convenio. Componente sin levantar, Object.create.
 */
describe("PagoTouchComponent: convenio como forma de pago única y sin descuento", () => {
  let c: any;
  let abrio: boolean;
  let avisos: string[];

  beforeEach(() => {
    c = Object.create(PagoTouchComponent.prototype);
    abrio = false;
    avisos = [];
    c.cobroDetalleList = [];
    c.formaPagoList = [{ id: 1, descripcion: "EFECTIVO" }, { id: 3, descripcion: "CONVENIO" }];
    c.formGroup = { controls: { formaPago: { setValue: () => {} }, saldo: { value: 7500 } } };
    c.notificacionSnackbar = { openWarn: (texto: string) => avisos.push(texto) };
    c.saldoCero = () => false;
    c.saldoAMonedaDelCredito = () => 7500;
    c.matDialog = { open: () => { abrio = true; return { afterClosed: () => ({ subscribe: () => {} }) }; } };
  });

  it("sin líneas abre el diálogo de convenio", () => {
    c.onConvenioClick();
    expect(abrio).toBeTrue();
    expect(avisos).toEqual([]);
  });

  it("con efectivo o tarjeta ya cargado no abre y avisa", () => {
    c.cobroDetalleList = [{ pago: true, descuento: false, formaPago: { descripcion: "EFECTIVO" } }];
    c.onConvenioClick();
    expect(abrio).toBeFalse();
    expect(avisos[0]).toBe("El convenio solo se puede usar como única forma de pago.");
    expect(c.selectedFormaPago.descripcion).toBe("EFECTIVO");
  });

  it("con un descuento cargado no abre y avisa por el descuento", () => {
    c.cobroDetalleList = [{ pago: false, descuento: true, formaPago: { descripcion: "EFECTIVO" } }];
    c.onConvenioClick();
    expect(abrio).toBeFalse();
    expect(avisos[0]).toBe("No se puede aplicar descuento a una venta por convenio.");
  });

  it("con CONVENIO elegido el descuento no abre su diálogo ni deja la marca puesta", () => {
    c.selectedFormaPago = { id: 3, descripcion: "CONVENIO" };
    c.isDescuento = false;
    c.onDescuento();
    expect(abrio).toBeFalse();
    expect(c.isDescuento).toBeFalse();
    expect(avisos[0]).toBe("No se puede aplicar descuento a una venta por convenio.");
  });
});
