import { CobroDetalle } from '../../../operaciones/venta/cobro/cobro-detalle.model';
import { esCobroTarjetaRegistrable, lineasTarjetaSinTerminal } from './cobro-tarjeta';

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
