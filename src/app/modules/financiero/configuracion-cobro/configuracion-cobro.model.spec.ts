import { aumentoPermitido, mensajeTopeAumento } from './configuracion-cobro.model';

describe('aumentoPermitido', () => {
  const total = 100000;

  it('sin configuración aplica el 20%: un aumento del 21% se bloquea (antes F8 lo dejaba pasar)', () => {
    expect(aumentoPermitido(-21000, total, null)).toBeFalse();
    expect(aumentoPermitido(-21000, total, undefined)).toBeFalse();
  });

  it('justo en el tope se permite y 1 Gs arriba se bloquea', () => {
    expect(aumentoPermitido(-20000, total, null)).toBeTrue();
    expect(aumentoPermitido(-20001, total, null)).toBeFalse();
  });

  it('sin tope permite cualquier aumento', () => {
    expect(aumentoPermitido(-500000, total, { aumentoConTope: false, aumentoTopePorcentaje: 20 })).toBeTrue();
  });

  it('usa el porcentaje configurado, con decimales', () => {
    expect(aumentoPermitido(-50000, total, { aumentoConTope: true, aumentoTopePorcentaje: 50 })).toBeTrue();
    expect(aumentoPermitido(-12500, total, { aumentoConTope: true, aumentoTopePorcentaje: 12.5 })).toBeTrue();
    expect(aumentoPermitido(-12501, total, { aumentoConTope: true, aumentoTopePorcentaje: 12.5 })).toBeFalse();
  });

  it('un dato faltante o inválido se lee como con tope del 20%', () => {
    expect(aumentoPermitido(-21000, total, { aumentoTopePorcentaje: 20 })).toBeFalse();
    expect(aumentoPermitido(-21000, total, { aumentoConTope: true, aumentoTopePorcentaje: 0 })).toBeFalse();
    expect(aumentoPermitido(-21000, total, { aumentoConTope: true, aumentoTopePorcentaje: null })).toBeFalse();
  });

  it('un saldo en guaraníes que viene de un cobro en USD no queda afuera por redondeo', () => {
    // 122.500 Gs, se pagan 20 USD a 7.350 = 147.000 Gs: aumento 24.500 = 20% exacto.
    const totalGs = 122500;
    const saldo = totalGs - 20.0 * 7350.000000000001;
    expect(aumentoPermitido(saldo, totalGs, null)).toBeTrue();
  });

  it('sin saldo negativo no hay aumento', () => {
    expect(aumentoPermitido(0, total, null)).toBeFalse();
    expect(aumentoPermitido(5000, total, { aumentoConTope: false })).toBeFalse();
  });

  it('el aviso dice el porcentaje que rige', () => {
    expect(mensajeTopeAumento(null)).toContain('20%');
    expect(mensajeTopeAumento({ aumentoConTope: true, aumentoTopePorcentaje: 35 })).toContain('35%');
  });
});
