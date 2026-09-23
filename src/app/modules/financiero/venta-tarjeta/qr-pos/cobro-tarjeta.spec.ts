import { CobroDetalle } from '../../../operaciones/venta/cobro/cobro-detalle.model';
import { esCobroTarjetaRegistrable } from './cobro-tarjeta';

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
