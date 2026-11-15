import { RetiroIngresado, textoRetiroIngresado } from './retiro.model';

describe('textoRetiroIngresado', () => {
  const base: RetiroIngresado = {
    retiroId: 1151, sucursalId: 24, sucursalNombre: 'SUC. KM2', cajaSalidaId: 662,
    cajaVirtualId: 3, cajaVirtualNombre: 'TESORERIA', movimientoId: 90, usuario: 'JUAN PEREZ',
    ingresadoEn: '2026-11-14 18:30', // así lo manda el escalar Date del central

  };

  it('nombra la caja mayor, el usuario y la fecha', () => {
    expect(textoRetiroIngresado(base))
      .toBe('Caja #662 (SUC. KM2): retiro #1151 procesado en TESORERIA por JUAN PEREZ el 14/11/26 18:30');
  });

  it('sin usuario lo ingresó el sistema', () => {
    expect(textoRetiroIngresado({ ...base, usuario: null }))
      .toBe('Caja #662 (SUC. KM2): retiro #1151 procesado en TESORERIA por el sistema el 14/11/26 18:30');
  });

  it('sin movimiento pero con caja mayor: procesado sin montos', () => {
    expect(textoRetiroIngresado({ ...base, movimientoId: null, usuario: null, ingresadoEn: null }))
      .toBe('Caja #662 (SUC. KM2): retiro #1151 procesado en TESORERIA sin montos');
  });

  it('sin movimiento ni caja mayor: dado por procesado', () => {
    expect(textoRetiroIngresado({ ...base, movimientoId: null, cajaVirtualId: null, cajaVirtualNombre: null, usuario: null, ingresadoEn: null }))
      .toBe('Caja #662 (SUC. KM2): retiro #1151 dado por procesado sin ingreso a caja mayor');
  });

  it('sin nombre de sucursal usa el id', () => {
    expect(textoRetiroIngresado({ ...base, sucursalNombre: null })).toContain('Caja #662 (sucursal 24)');
  });
});
