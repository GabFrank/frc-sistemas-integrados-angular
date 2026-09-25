import { cajaEstaAbierta } from './caja-abierta';

/**
 * Mismos casos que `CapturaCuponCajaAbiertaTest` del filial: los dos lados tienen que decir lo
 * mismo sobre la misma caja.
 */
describe('cajaEstaAbierta', () => {
  it('caja activa con estado vacío, el caso real de farmacia, está abierta', () => {
    expect(cajaEstaAbierta({ activo: true, estado: null } as any)).toBeTrue();
  });

  it('caja cerrada no está abierta', () => {
    expect(cajaEstaAbierta({ activo: false, fechaCierre: '2026-09-24T22:00:00' } as any)).toBeFalse();
  });

  it('activo nulo o sin caja no está abierta', () => {
    expect(cajaEstaAbierta({ activo: null } as any)).toBeFalse();
    expect(cajaEstaAbierta(null)).toBeFalse();
    expect(cajaEstaAbierta(undefined)).toBeFalse();
  });

  it('EN_PROCESO no alcanza si la caja no está activa', () => {
    expect(cajaEstaAbierta({ activo: false, estado: 'EN_PROCESO' } as any)).toBeFalse();
  });
});
