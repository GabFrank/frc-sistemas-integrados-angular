import { loteMasProximoAVencer, loteUnicoParaAsignar } from './lotes-caja';

const lote = (loteId: number, disp: number, venc?: string): any => ({
  loteId, numeroLote: 'L' + loteId, cantidadDisponible: disp,
  fechaVencimiento: venc ? new Date(venc) : null
});

describe('lotes-caja (lotes flexibles #429)', () => {
  it('un solo lote con saldo se asigna sin selector, acotado al saldo', () => {
    const d = loteUnicoParaAsignar([lote(1, 3, '2027-01-01')], 5);
    expect(d).toEqual({ tipo: 'unico', lote: { loteId: 1, cantidad: 3 } });
  });
  it('ignora la fila SIN LOTE y los lotes en 0', () => {
    const d = loteUnicoParaAsignar([lote(null, 9), lote(2, 0), lote(3, 10)], 2);
    expect(d).toEqual({ tipo: 'unico', lote: { loteId: 3, cantidad: 2 } });
  });
  it('sin stock por lote agrega automático', () => {
    expect(loteUnicoParaAsignar([], 2).tipo).toBe('automatico');
    expect(loteUnicoParaAsignar([lote(1, 0)], 2).tipo).toBe('automatico');
  });
  it('varios lotes abren el selector', () => {
    expect(loteUnicoParaAsignar([lote(1, 1), lote(2, 1)], 2).tipo).toBe('selector');
  });
  it('premarca el de vencimiento más próximo; sin fecha va al final', () => {
    const l = loteMasProximoAVencer([lote(1, 5), lote(2, 5, '2027-06-01'), lote(3, 5, '2027-01-01'), lote(4, 0, '2026-01-01')]);
    expect(l.loteId).toBe(3);
  });
});
