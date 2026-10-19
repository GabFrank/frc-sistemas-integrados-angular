import { esClienteInnominado } from './edit-factura-legal-dialog.component';

// #433: hasta 09/2026 las innominadas se emitían con el cliente 0 «SIN NOMBRE»: tener cliente no es estar nominada
describe('esClienteInnominado', () => {
  const cliente = (nombre: string, documento: string) => ({ persona: { nombre, documento } } as any);

  it('sin cliente o sin persona es innominado', () => {
    expect(esClienteInnominado(null)).toBeTrue();
    expect(esClienteInnominado({} as any)).toBeTrue();
  });

  it('el cliente genérico «SIN NOMBRE» es innominado', () => {
    expect(esClienteInnominado(cliente('SIN NOMBRE', 'X'))).toBeTrue();
    expect(esClienteInnominado(cliente(' sin nombre ', '0000000000'))).toBeTrue();
  });

  it('sin documento o con documento 0 es innominado', () => {
    expect(esClienteInnominado(cliente('MAURO RIVAS', ''))).toBeTrue();
    expect(esClienteInnominado(cliente('MAURO RIVAS', '0'))).toBeTrue();
  });

  it('un cliente con nombre y documento está identificado', () => {
    expect(esClienteInnominado(cliente('MAURO RIVAS', '5466642'))).toBeFalse();
  });
});
