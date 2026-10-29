import { ayudaTickets, estadoSorteo, formatearMonto } from './sorteo.util';

describe('sorteo.util', () => {
  const hoy = new Date(2026, 9, 28);

  it('estadoSorteo', () => {
    expect(estadoSorteo({ activo: false }, hoy)).toBe('CORTADO');
    expect(estadoSorteo({ activo: true, fechaDesde: '2026-10-29 00:00' }, hoy)).toBe('PROGRAMADO');
    expect(estadoSorteo({ activo: true, fechaHasta: '2026-10-27 00:00' }, hoy)).toBe('FINALIZADO');
    expect(estadoSorteo({ activo: true, fechaHasta: '2026-10-28 00:00' }, hoy)).toBe('VIGENTE');
    expect(estadoSorteo({ activo: true }, hoy)).toBe('VIGENTE');
  });

  it('formatearMonto', () => {
    expect(formatearMonto(250000)).toBe('250.000');
    expect(formatearMonto(999)).toBe('999');
  });

  it('ayudaTickets', () => {
    expect(ayudaTickets('POR_MULTIPLO', 100000, null, null)).toBe('Compra de 250.000 → 2 tickets');
    expect(ayudaTickets('POR_MULTIPLO', 100000, null, 1)).toBe('Compra de 250.000 → 1 ticket (máximo 1 por venta)');
    expect(ayudaTickets('UNA_POR_VENTA', 100000, null, null)).toBe('Compra desde 100.000 → 1 ticket');
    expect(ayudaTickets('CANTIDAD_FIJA', 100000, 3, null)).toBe('Compra desde 100.000 → 3 tickets');
    expect(ayudaTickets('CANTIDAD_FIJA', 100000, null, null)).toBe('');
    expect(ayudaTickets('POR_MULTIPLO', null, null, null)).toBe('');
  });
});
