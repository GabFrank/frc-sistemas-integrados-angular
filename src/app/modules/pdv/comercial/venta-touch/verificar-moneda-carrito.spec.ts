import { Subject, of } from "rxjs";
import { Moneda } from "../../../financiero/moneda/moneda.model";
import { VentaItem } from "../../../operaciones/venta/venta-item.model";
import { VentaTouchComponent } from "./venta-touch.component";

/**
 * #709: antes de cobrar, el PDV relee la moneda de los precios y no cobra si alguno del carrito cambió desde que se
 * agregó. Se prueba la guardia sobre el componente sin levantarlo (Object.create): solo los campos que usa.
 */
describe("VentaTouchComponent: verificar la moneda de los precios antes de cobrar (#709)", () => {
  const usd = { id: "3", denominacion: "DOLAR", simbolo: "US$", decimales: 2 } as any as Moneda;
  let c: any;
  let lectura$: Subject<{ leido: boolean; mapa: Map<string, Moneda> | null }>;
  let avisos: string[];

  function item(precioId: number, vista: string | null, descripcion = "BANES FORTE"): VentaItem {
    const i = new VentaItem();
    i.precioVenta = { id: precioId, precio: 5.85 } as any;
    i.producto = { descripcion } as any;
    i.monedaPrecioVista = vista;
    i.cantidad = 1;
    i.precio = 5.85;
    return i;
  }

  beforeEach(() => {
    lectura$ = new Subject();
    avisos = [];
    c = Object.create(VentaTouchComponent.prototype);
    c.precioMonedaService = { preciosEnOtraMonedaVigente: jasmine.createSpy().and.callFake(() => lectura$) };
    c.notificacionSnackbar = { openWarn: (m: string) => avisos.push(m) };
    c.preciosEnOtraMoneda = new Map<string, Moneda>();
    c.selectedItemList = [];
    c.verificandoPrecios = false;
    c.guardandoVenta = false;
    c.disableCobroRapido = false;
    c.modoConsulta = false;
    c.isDelivery = false;
    spyOn(c, "cobrarTicket");
    spyOn(c, "abrirPago");
  });

  it("F8 con un precio que pasó a USD después de agregarlo: no cobra y avisa", () => {
    c.selectedItemList = [item(10, null)];
    c.onTicketClick(false);
    expect(c.verificandoPrecios).toBeTrue();
    lectura$.next({ leido: true, mapa: new Map([["10", usd]]) });
    expect(c.cobrarTicket).not.toHaveBeenCalled();
    expect(avisos[0]).toContain("BANES FORTE");
    expect(c.verificandoPrecios).toBeFalse();
    // El mapa vigente queda en memoria: el ítem que se vuelva a cargar entra con la moneda nueva
    expect(c.preciosEnOtraMoneda.get("10")).toBe(usd);
  });

  it("Pago (F12) con un precio que volvió a la moneda de la empresa: no abre el pago", () => {
    c.selectedItemList = [item(10, "3")];
    c.onPagoClick();
    lectura$.next({ leido: true, mapa: new Map() });
    expect(c.abrirPago).not.toHaveBeenCalled();
    expect(avisos.length).toBe(1);
  });

  it("sin cambios de moneda: cobra como siempre", () => {
    c.selectedItemList = [item(10, "3"), item(11, null)];
    c.onTicketClick(true);
    lectura$.next({ leido: true, mapa: new Map([["10", usd]]) });
    expect(c.cobrarTicket).toHaveBeenCalledWith(true);
    expect(avisos).toEqual([]);
  });

  it("doble F8 mientras verifica: una sola lectura y un solo cobro", () => {
    c.selectedItemList = [item(10, null)];
    c.onTicketClick(false);
    c.onTicketClick(false);
    c.onPagoClick();
    expect(c.precioMonedaService.preciosEnOtraMonedaVigente).toHaveBeenCalledTimes(1);
    lectura$.next({ leido: true, mapa: new Map() });
    expect(c.cobrarTicket).toHaveBeenCalledTimes(1);
    expect(c.abrirPago).not.toHaveBeenCalled();
  });

  it("no se pudo leer y hay precios en otra moneda conocidos: bloquea y libera", () => {
    c.preciosEnOtraMoneda = new Map([["10", usd]]);
    c.selectedItemList = [item(10, "3")];
    spyOn(console, "warn");
    c.onTicketClick(false);
    lectura$.next({ leido: false, mapa: null });
    expect(c.cobrarTicket).not.toHaveBeenCalled();
    expect(c.verificandoPrecios).toBeFalse();
    expect(avisos[0]).toContain("No se pudo verificar");
  });

  it("no se pudo leer y no hay precios en otra moneda (filial vieja, bodega): cobra como siempre", () => {
    c.selectedItemList = [item(10, null)];
    c.onTicketClick(false);
    lectura$.next({ leido: false, mapa: null });
    expect(c.cobrarTicket).toHaveBeenCalled();
  });

  it("la lectura falla con error: con mapa vacío cobra, con mapa no vacío bloquea", () => {
    c.selectedItemList = [item(10, null)];
    const err$ = new Subject<any>();
    c.precioMonedaService.preciosEnOtraMonedaVigente.and.returnValue(err$);
    c.onTicketClick(false);
    err$.error(new Error("red"));
    expect(c.cobrarTicket).toHaveBeenCalledTimes(1);
    expect(c.verificandoPrecios).toBeFalse();

    c.preciosEnOtraMoneda = new Map([["10", usd]]);
    const err2$ = new Subject<any>();
    c.precioMonedaService.preciosEnOtraMonedaVigente.and.returnValue(err2$);
    c.onTicketClick(false);
    err2$.error(new Error("red"));
    expect(c.cobrarTicket).toHaveBeenCalledTimes(1);
  });

  it("agregar un producto mientras verifica: no lo agrega y avisa", () => {
    c.verificandoPrecios = true;
    c.addItem(item(12, null));
    expect(avisos[0]).toContain("Verificando precios");
  });

  it("carrito vacío o delivery en F8: no verifica, el cuerpo de siempre decide", () => {
    c.onTicketClick(false);
    c.isDelivery = true;
    c.selectedItemList = [item(10, null)];
    c.onTicketClick(false);
    expect(c.precioMonedaService.preciosEnOtraMonedaVigente).not.toHaveBeenCalled();
    expect(c.cobrarTicket).toHaveBeenCalledTimes(2);
  });

  it("el mapa vigente sale de la filial (of: lectura sincrónica también funciona)", () => {
    c.precioMonedaService.preciosEnOtraMonedaVigente.and.returnValue(of({ leido: true, mapa: new Map() }));
    c.selectedItemList = [item(10, null)];
    c.onPagoClick();
    expect(c.abrirPago).toHaveBeenCalled();
    expect(c.verificandoPrecios).toBeFalse();
  });
});
