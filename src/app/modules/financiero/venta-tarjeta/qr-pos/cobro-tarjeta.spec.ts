import { CobroDetalle } from '../../../operaciones/venta/cobro/cobro-detalle.model';
import { esCobroTarjetaRegistrable, lineaConMismoCupon, lineasTarjetaSinTerminal } from './cobro-tarjeta';
import { DatosCupon } from './formato-qr-pos.model';

function linea(over: Partial<CobroDetalle> = {}): CobroDetalle {
  const cd = new CobroDetalle();
  Object.assign(cd, {
    formaPago: { id: 2, descripcion: 'TARJETA' },
    pago: true,
    vuelto: false,
    descuento: false,
    valor: 60000
  }, over);
  return cd;
}

describe('esCobroTarjetaRegistrable', () => {

  it('acepta el cobro con tarjeta normal', () => {
    expect(esCobroTarjetaRegistrable(linea())).toBeTrue();
  });

  it('descarta otras formas de pago', () => {
    expect(esCobroTarjetaRegistrable(linea({ formaPago: { id: 1, descripcion: 'EFECTIVO' } as any }))).toBeFalse();
  });

  it('descarta la línea sin forma de pago', () => {
    expect(esCobroTarjetaRegistrable(linea({ formaPago: null }))).toBeFalse();
  });

  it('descarta el vuelto en tarjeta — no pasa por el POS, no hay cupón', () => {
    expect(esCobroTarjetaRegistrable(linea({ vuelto: true }))).toBeFalse();
  });

  it('descarta el descuento — no mueve plata por la terminal', () => {
    expect(esCobroTarjetaRegistrable(linea({ descuento: true }))).toBeFalse();
  });

  it('descarta la línea que no es de pago', () => {
    expect(esCobroTarjetaRegistrable(linea({ pago: false }))).toBeFalse();
  });

  it('no explota con una línea nula', () => {
    expect(esCobroTarjetaRegistrable(null as any)).toBeFalse();
    expect(esCobroTarjetaRegistrable(undefined as any)).toBeFalse();
  });

  it('es case-sensitive: la descripción viaja en mayúsculas desde el backend', () => {
    expect(esCobroTarjetaRegistrable(linea({ formaPago: { id: 2, descripcion: 'Tarjeta' } as any }))).toBeFalse();
  });
});

describe('lineasTarjetaSinTerminal', () => {
  const conTerminal = { id: 13, descripcion: 'BANCARD L1' } as any;

  it('devuelve la tarjeta a registrar que no tiene terminal (el caso de filial 1)', () => {
    const l = linea({ requiereRegistroTarjeta: true, terminalPos: null });
    expect(lineasTarjetaSinTerminal([l])).toEqual([l]);
  });

  it('no devuelve la que ya tiene terminal', () => {
    expect(lineasTarjetaSinTerminal([linea({ requiereRegistroTarjeta: true, terminalPos: conTerminal })]).length).toBe(0);
  });

  it('no exige terminal a la línea ya registrada de un delivery que se reabre', () => {
    expect(lineasTarjetaSinTerminal([linea({ requiereRegistroTarjeta: false, terminalPos: null })]).length).toBe(0);
  });

  it('no mira efectivo, vuelto ni descuento', () => {
    const efectivo = linea({ formaPago: { id: 1, descripcion: 'EFECTIVO' } as any, requiereRegistroTarjeta: true });
    const vuelto = linea({ vuelto: true, requiereRegistroTarjeta: true });
    expect(lineasTarjetaSinTerminal([efectivo, vuelto]).length).toBe(0);
  });

  it('tolera una lista vacía o nula', () => {
    expect(lineasTarjetaSinTerminal([]).length).toBe(0);
    expect(lineasTarjetaSinTerminal(null).length).toBe(0);
  });
});

// #625: venta 81509 de Itaipú, el mismo cupón en dos líneas del mismo cobro.
describe('lineaConMismoCupon', () => {

  const cupon = (over: Partial<DatosCupon> = {}): DatosCupon => ({ qrCrudo: '', formato: null, ...over });

  function conCupon(c: DatosCupon, terminalId: any = 3): CobroDetalle {
    return linea({ terminalPos: terminalId == null ? null : { id: terminalId } as any, datosCupon: c });
  }

  it('encuentra la otra línea con el mismo QR, aunque venga con espacios', () => {
    const otra = conCupon(cupon({ qrCrudo: 'FRCP1*U1**BRL*50*REF1*202611211210' }));
    const nueva = linea({ terminalPos: { id: 3 } as any });
    expect(lineaConMismoCupon([otra, nueva], nueva, cupon({ qrCrudo: '  FRCP1*U1**BRL*50*REF1*202611211210\n' })))
      .toBe(otra);
  });

  it('encuentra la otra línea con la misma referencia', () => {
    const otra = conCupon(cupon({ identificadorTransaccion: 'E2E123' }));
    const nueva = linea();
    expect(lineaConMismoCupon([otra, nueva], nueva, cupon({ identificadorTransaccion: ' E2E123 ' }))).toBe(otra);
  });

  it('mismo código en la misma terminal: compara el id como número (GraphQL lo manda string)', () => {
    const otra = conCupon(cupon({ codigoAutorizacion: 'ab12', monto: 50 }), '3');
    const nueva = linea({ terminalPos: { id: 3 } as any });
    expect(lineaConMismoCupon([otra, nueva], nueva, cupon({ codigoAutorizacion: ' AB12 ', monto: 50 }))).toBe(otra);
  });

  it('mismo código sin monto en uno de los dos: no alcanza para descartar', () => {
    const otra = conCupon(cupon({ codigoAutorizacion: 'AB12' }));
    const nueva = linea({ terminalPos: { id: 3 } as any });
    expect(lineaConMismoCupon([otra, nueva], nueva, cupon({ codigoAutorizacion: 'AB12', monto: 50 }))).toBe(otra);
  });

  it('mismo código y sin terminal en un lado: cuenta como la misma, como en el backend', () => {
    const otra = conCupon(cupon({ codigoAutorizacion: 'AB12', monto: 50 }), null);
    const nueva = linea({ terminalPos: { id: 3 } as any });
    expect(lineaConMismoCupon([otra, nueva], nueva, cupon({ codigoAutorizacion: 'AB12', monto: 50 }))).toBe(otra);
  });

  it('mismo código en otra terminal: no es el mismo cupón', () => {
    const otra = conCupon(cupon({ codigoAutorizacion: 'AB12', monto: 50 }), 4);
    const nueva = linea({ terminalPos: { id: 3 } as any });
    expect(lineaConMismoCupon([otra, nueva], nueva, cupon({ codigoAutorizacion: 'AB12', monto: 50 }))).toBeNull();
  });

  it('mismo código con montos distintos: es una colisión de código corto, no un repetido', () => {
    const otra = conCupon(cupon({ codigoAutorizacion: 'AB12', monto: 50 }));
    const nueva = linea({ terminalPos: { id: 3 } as any });
    expect(lineaConMismoCupon([otra, nueva], nueva, cupon({ codigoAutorizacion: 'AB12', monto: 60 }))).toBeNull();
  });

  it('la propia línea no cuenta: volver a escanear el mismo cupón en ella no es un repetido', () => {
    const misma = conCupon(cupon({ qrCrudo: 'QR-1' }));
    expect(lineaConMismoCupon([misma], misma, cupon({ qrCrudo: 'QR-1' }))).toBeNull();
  });

  it('cupones distintos y líneas sin cupón no cortan', () => {
    const otra = conCupon(cupon({ qrCrudo: 'QR-1', identificadorTransaccion: 'R1', codigoAutorizacion: 'A1' }));
    const sinCupon = linea();
    const nueva = linea();
    expect(lineaConMismoCupon([otra, sinCupon, nueva], nueva,
      cupon({ qrCrudo: 'QR-2', identificadorTransaccion: 'R2', codigoAutorizacion: 'A2' }))).toBeNull();
  });

  it('un cupón vacío no coincide con otro vacío', () => {
    const otra = conCupon(cupon());
    const nueva = linea();
    expect(lineaConMismoCupon([otra, nueva], nueva, cupon())).toBeNull();
  });

  it('tolera lista o cupón nulos', () => {
    expect(lineaConMismoCupon(null, linea(), cupon({ qrCrudo: 'QR-1' }))).toBeNull();
    expect(lineaConMismoCupon([linea()], linea(), null)).toBeNull();
  });
});
