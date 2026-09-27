import { estadoPrecioEspecial, fechaParam, idsSucursalesSeleccionadas, textoVigencia } from './precio-especial.util';

describe('precio-especial.util', () => {
  const hoy = new Date(2026, 9, 10, 15, 30);

  it('cortado gana a cualquier fecha', () => {
    expect(estadoPrecioEspecial({ activo: false }, hoy)).toBe('CORTADO');
  });

  it('sin fechas y activo es vigente', () => {
    expect(estadoPrecioEspecial({ activo: true }, hoy)).toBe('VIGENTE');
  });

  it('los extremos son inclusivos y el backend manda "yyyy-MM-dd 00:00"', () => {
    expect(estadoPrecioEspecial({ activo: true, fechaDesde: '2026-10-10 00:00', fechaHasta: '2026-10-10 00:00' }, hoy)).toBe('VIGENTE');
    expect(estadoPrecioEspecial({ activo: true, fechaDesde: '2026-10-11 00:00' }, hoy)).toBe('PROGRAMADO');
    expect(estadoPrecioEspecial({ activo: true, fechaHasta: '2026-10-09 00:00' }, hoy)).toBe('VENCIDO');
  });

  it('fechaParam no corre el dia por UTC', () => {
    expect(fechaParam(new Date(2026, 9, 1, 23, 50))).toBe('2026-10-01');
    expect(fechaParam(null)).toBeNull();
  });

  it('"Todas" se expande sin el central y sin duplicados; ids como numero', () => {
    const todas = [{ id: '0' }, { id: '1' }, { id: '3' }];
    expect(idsSucursalesSeleccionadas([null, { id: '1' }], todas)).toEqual([1, 3]);
    expect(idsSucursalesSeleccionadas([{ id: '3' }, { id: 3 }], todas)).toEqual([3]);
    expect(idsSucursalesSeleccionadas([], todas)).toEqual([]);
  });

  it('textoVigencia: sin fechas es "Permanente" y el resto se lee como rango', () => {
    expect(textoVigencia({})).toBe('Permanente');
    expect(textoVigencia({ fechaDesde: '2026-10-01 00:00' })).toBe('Desde el 01/10/2026');
    expect(textoVigencia({ fechaHasta: '2026-10-31 00:00' })).toBe('Hasta el 31/10/2026');
    expect(textoVigencia({ fechaDesde: '2026-10-01 00:00', fechaHasta: '2026-10-31 00:00' })).toBe('01/10/2026 al 31/10/2026');
  });
});
