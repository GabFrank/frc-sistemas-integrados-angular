import { ApolloError } from "@apollo/client/core";
import { MENSAJE_TIMEOUT_MUTATION } from "../../../shared/services/timeout-link";
import {
  avisoTrasMutacion,
  debePedirClienteParaFacturar,
  esEnvioAFilialSinConfirmar,
  esRechazoPorFacturaSinNombre,
  MAX_PEDIDOS_DE_CLIENTE_PARA_FACTURAR,
  MENSAJE_RESPUESTA_VACIA,
  mensajeDeError,
  motivoDelRechazo,
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

describe('avisoTrasMutacion (#488)', () => {
  const QUE = 'se verificó el ítem';
  const AVISO = `No se pudo confirmar si ${QUE}: puede seguir aplicándose. Esperá unos segundos y revisá antes de repetir.`;

  // Error que arma el link de central offline de GraphqlConnectionService al cortar a los 3 s.
  const centralOffline = () => {
    const err: any = new Error('El servidor central no responde (offline).');
    err.networkError = true;
    return err;
  };
  // Error que arma crearTimeoutLink al vencer una mutation.
  const timeoutDeLink = () => {
    const err: any = new Error(MENSAJE_TIMEOUT_MUTATION);
    err.esTimeout = true;
    return err;
  };

  it('rechazo del servidor: null, el motivo ya lo avisó el genérico', () => {
    expect(avisoTrasMutacion([{ message: 'La nota ya está verificada' }], QUE)).toBeNull();
    expect(avisoTrasMutacion({ graphQLErrors: [{ message: 'La nota ya está verificada' }] }, QUE)).toBeNull();
  });

  it('corte por tiempo del link: null, el link ya avisó', () => {
    expect(avisoTrasMutacion(timeoutDeLink(), QUE)).toBeNull();
    expect(avisoTrasMutacion(new ApolloError({ networkError: timeoutDeLink() }), QUE)).toBeNull();
  });

  it('respuesta vacía, sola o junto a otro error: avisa que no se pudo confirmar', () => {
    expect(avisoTrasMutacion([{ message: MENSAJE_RESPUESTA_VACIA }], QUE)).toBe(AVISO);
    expect(avisoTrasMutacion([{ message: 'otro' }, { message: MENSAJE_RESPUESTA_VACIA }], QUE)).toBe(AVISO);
  });

  it('errores GraphQL con networkError: avisa, manda lo incierto', () => {
    expect(avisoTrasMutacion({ networkError: {}, graphQLErrors: [{ message: 'x' }] }, QUE)).toBe(AVISO);
  });

  it('error de red de Apollo, con o sin status HTTP: avisa', () => {
    expect(avisoTrasMutacion(new ApolloError({ networkError: new Error('Http failure response: 0 Unknown Error') }), QUE)).toBe(AVISO);
    expect(avisoTrasMutacion(new ApolloError({ networkError: Object.assign(new Error('401'), { status: 401 }) }), QUE)).toBe(AVISO);
    expect(avisoTrasMutacion(new ApolloError({ networkError: Object.assign(new Error('500'), { status: 500 }) }), QUE)).toBe(AVISO);
  });

  it('central offline, suelto o envuelto por Apollo: avisa', () => {
    expect(avisoTrasMutacion(centralOffline(), QUE)).toBe(AVISO);
    expect(avisoTrasMutacion(new ApolloError({ networkError: centralOffline() }), QUE)).toBe(AVISO);
  });

  it('sin error reconocible (null, undefined, arreglo vacío): avisa', () => {
    expect(avisoTrasMutacion(null, QUE)).toBe(AVISO);
    expect(avisoTrasMutacion(undefined, QUE)).toBe(AVISO);
    expect(avisoTrasMutacion([], QUE)).toBe(AVISO);
  });

  it('el texto nombra la operación', () => {
    expect(avisoTrasMutacion(null, 'se recepcionaron los ítems')).toContain('No se pudo confirmar si se recepcionaron los ítems:');
  });
});

describe('motivoDelRechazo (#488)', () => {
  it('devuelve el primer mensaje de un rechazo en arreglo', () => {
    expect(motivoDelRechazo([{ message: 'El pedido ya está finalizado' }, { message: 'otro' }])).toBe('El pedido ya está finalizado');
  });

  it('acepta un objeto con graphQLErrors y un ApolloError', () => {
    expect(motivoDelRechazo({ graphQLErrors: [{ message: 'No existe la nota' }] })).toBe('No existe la nota');
    expect(motivoDelRechazo(new ApolloError({ graphQLErrors: [{ message: 'No existe la nota' } as any] }))).toBe('No existe la nota');
  });

  it('quita el prefijo de graphql-java', () => {
    expect(motivoDelRechazo([{ message: 'Exception while fetching data (/desvincularProductoProveedor) : Producto no encontrado' }]))
      .toBe('Producto no encontrado');
  });

  it('saltea mensajes vacíos y usa el siguiente', () => {
    expect(motivoDelRechazo([{ message: '' }, { message: 'Motivo real' }])).toBe('Motivo real');
  });

  it('null si el rechazo no trae ningún texto', () => {
    expect(motivoDelRechazo([{ message: '  ' }, {}])).toBeNull();
  });

  it('null si no es un rechazo', () => {
    expect(motivoDelRechazo(new ApolloError({ networkError: new Error('Http failure response: 0 Unknown Error') }))).toBeNull();
    expect(motivoDelRechazo({ networkError: {}, graphQLErrors: [{ message: 'x' }] })).toBeNull();
    expect(motivoDelRechazo([{ message: MENSAJE_RESPUESTA_VACIA }])).toBeNull();
    expect(motivoDelRechazo([])).toBeNull();
    expect(motivoDelRechazo(null)).toBeNull();
    expect(motivoDelRechazo(undefined)).toBeNull();
  });
});

describe('mensajeDeError', () => {

  // La forma que realmente llega desde GenericCrudService.onCustomMutation: `obs.error(res.errors)`
  // propaga el ARRAY de GraphQLError. Leer `.message` sobre el array da undefined, y por eso el
  // mensaje del backend se perdía y el usuario veía un texto genérico.
  it('saca el mensaje del array de errores de GraphQL', () => {
    const err = [{ message: 'Ese cupon ya fue registrado en la venta con tarjeta 18.' }];

    expect(mensajeDeError(err, 'fallback')).toBe('Ese cupon ya fue registrado en la venta con tarjeta 18.');
  });

  it('saca el mensaje de un ApolloError', () => {
    const err = { graphQLErrors: [{ message: 'El cobro 10 ya esta vinculado a otro cupon.' }] };

    expect(mensajeDeError(err, 'fallback')).toBe('El cobro 10 ya esta vinculado a otro cupon.');
  });

  it('saca el mensaje de un Error común', () => {
    expect(mensajeDeError(new Error('se cayó la red'), 'fallback')).toBe('se cayó la red');
  });

  it('usa el fallback si el error no trae nada legible', () => {
    expect(mensajeDeError(null, 'fallback')).toBe('fallback');
    expect(mensajeDeError(undefined, 'fallback')).toBe('fallback');
    expect(mensajeDeError({}, 'fallback')).toBe('fallback');
    expect(mensajeDeError([], 'fallback')).toBe('fallback');
  });

  it('saltea las entradas vacías del array y toma la primera con mensaje', () => {
    const err = [{}, { message: 'el bueno' }];

    expect(mensajeDeError(err, 'fallback')).toBe('el bueno');
  });

  it('con graphQLErrors vacío cae al message del propio error', () => {
    const err = { graphQLErrors: [], message: 'Network error' };

    expect(mensajeDeError(err, 'fallback')).toBe('Network error');
  });
});
