import { ApolloError } from "@apollo/client/core";
import {
  debePedirClienteParaFacturar,
  esRechazoPorFacturaSinNombre,
  MAX_PEDIDOS_DE_CLIENTE_PARA_FACTURAR,
  MENSAJE_RESPUESTA_VACIA,
} from "./graphqlErrorUtils";

// Texto de VentaNoFacturableException en el filial (FacturaLegalBuilder.ensayarDE).
const RECHAZO_SIN_NOMBRE = [
  {
    message:
      "No se puede facturar sin nombre una venta de 7.000.000 o mas. Cargue un cliente con nombre y documento (CI o RUC) y vuelva a intentar.",
  },
];

describe("esRechazoPorFacturaSinNombre", () => {
  it("reconoce el rechazo del filial", () => {
    expect(esRechazoPorFacturaSinNombre(RECHAZO_SIN_NOMBRE)).toBeTrue();
  });

  it("no reconoce otro rechazo", () => {
    expect(esRechazoPorFacturaSinNombre([{ message: "La caja está cerrada" }])).toBeFalse();
  });

  it("no reconoce un guardado sin confirmar, aunque traiga el texto", () => {
    expect(esRechazoPorFacturaSinNombre(null)).toBeFalse();
    expect(esRechazoPorFacturaSinNombre([])).toBeFalse();
    expect(esRechazoPorFacturaSinNombre([{ message: MENSAJE_RESPUESTA_VACIA }])).toBeFalse();
    expect(esRechazoPorFacturaSinNombre([...RECHAZO_SIN_NOMBRE, { message: MENSAJE_RESPUESTA_VACIA }])).toBeFalse();
    expect(
      esRechazoPorFacturaSinNombre(
        new ApolloError({ errorMessage: RECHAZO_SIN_NOMBRE[0].message, networkError: new Error("Failed to fetch") })
      )
    ).toBeFalse();
  });
});

describe("debePedirClienteParaFacturar", () => {
  const ventaComunSinCliente = {
    error: RECHAZO_SIN_NOMBRE,
    tieneCliente: false,
    facturaManualEmitida: false,
    esCredito: false,
    esDelivery: false,
    pedidos: 0,
  };

  it("pide el cliente en una venta común sin cliente", () => {
    expect(debePedirClienteParaFacturar(ventaComunSinCliente)).toBeTrue();
  });

  it("no pide ante otro error", () => {
    expect(debePedirClienteParaFacturar({ ...ventaComunSinCliente, error: [{ message: "La caja está cerrada" }] })).toBeFalse();
    expect(debePedirClienteParaFacturar({ ...ventaComunSinCliente, error: new Error("Failed to fetch") })).toBeFalse();
  });

  it("no pide con factura manual, crédito ni delivery", () => {
    expect(debePedirClienteParaFacturar({ ...ventaComunSinCliente, facturaManualEmitida: true })).toBeFalse();
    expect(debePedirClienteParaFacturar({ ...ventaComunSinCliente, esCredito: true })).toBeFalse();
    expect(debePedirClienteParaFacturar({ ...ventaComunSinCliente, esDelivery: true })).toBeFalse();
  });

  it("no pide si la venta ya traía un cliente que no eligió en este diálogo", () => {
    expect(debePedirClienteParaFacturar({ ...ventaComunSinCliente, tieneCliente: true })).toBeFalse();
  });

  it("vuelve a pedir una vez si el filial rechaza al cliente elegido, y después corta", () => {
    expect(debePedirClienteParaFacturar({ ...ventaComunSinCliente, tieneCliente: true, pedidos: 1 })).toBeTrue();
    expect(
      debePedirClienteParaFacturar({
        ...ventaComunSinCliente,
        tieneCliente: true,
        pedidos: MAX_PEDIDOS_DE_CLIENTE_PARA_FACTURAR,
      })
    ).toBeFalse();
  });
});
