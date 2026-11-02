import { ModoAjusteLote } from '../../../operaciones/lote/lote.model';
import { construirConteoRapido } from './conteo-rapido';

describe('construirConteoRapido', () => {
  const base = { productoId: 7, sucursalId: 1, modo: ModoAjusteLote.CORREGIR, motivo: ' conteo ', usuarioId: 3 };

  it('solo manda filas contadas y con diferencia, con saldoEsperado', () => {
    const r = construirConteoRapido([
      { loteId: 1, numeroLote: 'A', saldo: 10, contado: 8 },
      { loteId: 2, numeroLote: 'B', saldo: 5, contado: 5 },
      { loteId: 3, numeroLote: 'C', saldo: 4, contado: null }
    ], base);
    expect(r.length).toBe(1);
    expect(r[0]).toEqual(jasmine.objectContaining({ loteId: 1, cantidadFinal: 8, saldoEsperado: 10, motivo: 'conteo' }));
  });

  it('contar 0 también viaja', () => {
    const r = construirConteoRapido([{ loteId: 1, numeroLote: 'A', saldo: 3, contado: 0 }], base);
    expect(r.length).toBe(1);
    expect(r[0].cantidadFinal).toBe(0);
  });
});
