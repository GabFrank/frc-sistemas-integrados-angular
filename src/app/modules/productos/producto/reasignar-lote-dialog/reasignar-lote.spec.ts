import { construirReasignar, errorReasignar, FormReasignar } from './reasignar-lote';

describe('reasignar-lote', () => {
  const origen = { loteId: 1, numeroLote: 'L-A', saldo: 10 };
  const ok: FormReasignar = { origen, destinoId: 2, cantidad: 4, motivo: 'venta con lote equivocado' };

  it('acepta un pase válido', () => {
    expect(errorReasignar(ok)).toBeNull();
  });

  it('rechaza mismo lote, cantidad cero o mayor al saldo, y motivo vacío', () => {
    expect(errorReasignar({ ...ok, destinoId: 1 })).toContain('mismo lote');
    expect(errorReasignar({ ...ok, cantidad: 0 })).toContain('mayor a cero');
    expect(errorReasignar({ ...ok, cantidad: '' })).toContain('mayor a cero');
    expect(errorReasignar({ ...ok, cantidad: 11 })).toContain('tiene 10');
    expect(errorReasignar({ ...ok, motivo: '  ' })).toContain('motivo');
    expect(errorReasignar({ ...ok, origen: null })).toContain('origen');
    expect(errorReasignar({ ...ok, destinoId: null })).toContain('destino');
  });

  it('arma el input con el saldo que vio el operador', () => {
    const i = construirReasignar(ok, { productoId: 100, sucursalId: 4, usuarioId: 9 });
    expect(i.loteOrigenId).toBe(1);
    expect(i.loteDestinoId).toBe(2);
    expect(i.cantidad).toBe(4);
    expect(i.saldoEsperado).toBe(10);
    expect(i.forzar).toBe(false);
    expect(i.motivo).toBe('venta con lote equivocado');
  });
});
