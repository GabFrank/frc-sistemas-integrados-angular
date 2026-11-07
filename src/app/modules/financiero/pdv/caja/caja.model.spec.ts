import { CajaBalance, esBalanceVerificable, superaDisponible } from './caja.model';

/** Disponible de gasto y retiro con la misma regla que el filial (issue filial #80). */
describe('superaDisponible', () => {
  // Caso real de la prueba de #80: R$ 50,30 de apertura y retiros de 10,10 + 30 + 6.
  const saldoReal = 50.3 - 46.1;
  const diferencia = -saldoReal;

  it('acepta el monto que muestra la pantalla aunque el double quede apenas abajo', () => {
    expect(saldoReal).toBeLessThan(4.2);
    expect(4.2 > diferencia * -1).toBeTrue(); // la comparación vieja bloqueaba
    expect(superaDisponible(4.2, diferencia)).toBeFalse();
    expect(superaDisponible(4.21, diferencia)).toBeTrue();
  });

  it('el borde de la tolerancia no supera, un poco más sí', () => {
    expect(superaDisponible(100.005, -100)).toBeFalse();
    expect(superaDisponible(100.0051, -100)).toBeTrue();
  });

  it('un monto 0 o vacío nunca supera, aunque el disponible sea negativo', () => {
    expect(superaDisponible(0, 5000)).toBeFalse();
    expect(superaDisponible(null, 5000)).toBeFalse();
    expect(superaDisponible(undefined, 5000)).toBeFalse();
    expect(superaDisponible(0.01, 0)).toBeTrue();
  });
});

describe('esBalanceVerificable', () => {
  const balance = (gs: number, rs: number, ds: number) =>
    Object.assign(new CajaBalance(), { diferenciaGs: gs, diferenciaRs: rs, diferenciaDs: ds });

  it('exige las tres diferencias como números finitos', () => {
    expect(esBalanceVerificable(balance(-1000, 0, -5))).toBeTrue();
    expect(esBalanceVerificable(balance(NaN, 0, 0))).toBeFalse();
    expect(esBalanceVerificable(balance(null, 0, 0))).toBeFalse();
    expect(esBalanceVerificable(null)).toBeFalse();
  });
});
