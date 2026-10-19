import { ApolloError } from "@apollo/client/core";
import {
  debePedirClienteParaFacturar,
  esEnvioAFilialSinConfirmar,
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

describe('esEnvioAFilialSinConfirmar (#471)', () => {
  // Prefijo de FacturaLegalGraphQL.saveFacturaLegalToFilial, ya sin el de graphql-java.
  const PREFIJO = 'Error al crear factura en servidor filial: ';
  const con = (texto: string) => [{ message: PREFIJO + texto }];

  it('corte con el filial, 500 y respuesta que no es 201: sin confirmar', () => {
    expect(esEnvioAFilialSinConfirmar(con('Error al conectar con el servidor filial: Read timed out'))).toBeTrue();
    expect(esEnvioAFilialSinConfirmar(con('Error del servidor filial: could not execute statement'))).toBeTrue();
    expect(esEnvioAFilialSinConfirmar(con('Error al crear factura en servidor filial. Código: 200 OK'))).toBeTrue();
  });

  it('rechazo del filial (4xx) y fallas del central antes de enviar: no', () => {
    expect(esEnvioAFilialSinConfirmar(con('Error al crear factura legal: El timbrado detalle no está disponible: x'))).toBeFalse();
    expect(esEnvioAFilialSinConfirmar(con('Sucursal no encontrada: 9'))).toBeFalse();
    expect(esEnvioAFilialSinConfirmar(con('La sucursal no tiene IP configurada'))).toBeFalse();
  });

  it('un rechazo que menciona esas frases no cuenta: el texto va anclado al prefijo del central', () => {
    expect(esEnvioAFilialSinConfirmar(con('Error al crear factura legal: Error del servidor filial anterior'))).toBeFalse();
  });

  it('lo que no es un arreglo de errores GraphQL: no', () => {
    expect(esEnvioAFilialSinConfirmar(null)).toBeFalse();
    expect(esEnvioAFilialSinConfirmar(new Error(PREFIJO + 'Error del servidor filial: x'))).toBeFalse();
  });
});
