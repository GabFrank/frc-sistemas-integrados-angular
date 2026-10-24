import { aplicarGestion } from './lotes-producto-dialog.component';

describe('Lotes del producto: gestión (lotes flexibles, entrega 5)', () => {
  const base = { id: 1, saldoTotal: null, saldoLabel: '-', archivado: false, puedeArchivar: false };

  it('sin saldo en la red se puede archivar', () => {
    const fila = aplicarGestion(base, { saldoTotal: 0, archivado: false });
    expect(fila.puedeArchivar).toBeTrue();
    expect(fila.saldoLabel).toBe('0');
  });

  it('con saldo (positivo o negativo) no se puede archivar', () => {
    expect(aplicarGestion(base, { saldoTotal: 4, archivado: false }).puedeArchivar).toBeFalse();
    expect(aplicarGestion(base, { saldoTotal: -2, archivado: false }).puedeArchivar).toBeFalse();
  });

  it('archivado se marca y ofrece desarchivar, no archivar', () => {
    const fila = aplicarGestion(base, { saldoTotal: 0, archivado: true });
    expect(fila.archivado).toBeTrue();
    expect(fila.puedeArchivar).toBeFalse();
    expect(fila.saldoLabel).toContain('archivado');
  });

  it('sin dato del central no se ofrece archivar', () => {
    const fila = aplicarGestion(base, undefined);
    expect(fila.puedeArchivar).toBeFalse();
    expect(fila.saldoTotal).toBeNull();
  });
});
