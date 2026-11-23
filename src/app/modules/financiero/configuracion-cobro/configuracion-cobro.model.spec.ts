import { aumentoPermitido, aumentosRegistradosGs, descuentoPermitido, descuentosRegistradosGs, mensajeTopeAumento, mensajeTopeDescuento, topeDescuento } from './configuracion-cobro.model';

describe('aumentoPermitido', () => {
  const total = 100000;

  it('sin configuración aplica el 20%: un aumento del 21% se bloquea (antes F8 lo dejaba pasar)', () => {
    expect(aumentoPermitido(21000, total, null)).toBeFalse();
    expect(aumentoPermitido(21000, total, undefined)).toBeFalse();
  });

  it('justo en el tope se permite y 1 Gs arriba se bloquea', () => {
    expect(aumentoPermitido(20000, total, null)).toBeTrue();
    expect(aumentoPermitido(20001, total, null)).toBeFalse();
  });

  it('sin tope permite cualquier aumento', () => {
    expect(aumentoPermitido(500000, total, { aumentoConTope: false, aumentoTopePorcentaje: 20 })).toBeTrue();
  });

  it('usa el porcentaje configurado, con decimales, sin perder 1 Gs por punto flotante', () => {
    expect(aumentoPermitido(50000, total, { aumentoConTope: true, aumentoTopePorcentaje: 50 })).toBeTrue();
    expect(aumentoPermitido(12500, total, { aumentoConTope: true, aumentoTopePorcentaje: 12.5 })).toBeTrue();
    expect(aumentoPermitido(12501, total, { aumentoConTope: true, aumentoTopePorcentaje: 12.5 })).toBeFalse();
    // 100.000 × 33,3 / 100 da 33.299,999… en punto flotante
    expect(aumentoPermitido(33300, total, { aumentoConTope: true, aumentoTopePorcentaje: 33.3 })).toBeTrue();
    expect(aumentoPermitido(19990, total, { aumentoConTope: true, aumentoTopePorcentaje: 19.99 })).toBeTrue();
  });

  it('un dato faltante o inválido se lee como con tope del 20%', () => {
    expect(aumentoPermitido(21000, total, { aumentoTopePorcentaje: 20 })).toBeFalse();
    expect(aumentoPermitido(21000, total, { aumentoConTope: true, aumentoTopePorcentaje: 0 })).toBeFalse();
    expect(aumentoPermitido(21000, total, { aumentoConTope: true, aumentoTopePorcentaje: null })).toBeFalse();
  });

  it('un aumento cobrado en USD, como lo arma el cobro (saldo / cambio y de vuelta × cambio), no queda afuera por redondeo', () => {
    const totalGs = 122500;
    const cambio = 7350;
    const pagadoGs = 20 * cambio; // 147.000: 24.500 de más, el 20% exacto
    const valorUsd = (totalGs - pagadoGs) / cambio; // lo que el cobro pone en «valor» (negativo, en USD)
    expect(aumentoPermitido(-valorUsd * cambio, totalGs, null)).toBeTrue();
  });

  it('sin aumento o con total 0 no hay nada que permitir con tope', () => {
    expect(aumentoPermitido(0, total, null)).toBeFalse();
    expect(aumentoPermitido(-5000, total, { aumentoConTope: false })).toBeFalse();
    expect(aumentoPermitido(1, 0, null)).toBeFalse();
  });

  it('el aviso dice el porcentaje que rige', () => {
    expect(mensajeTopeAumento(null)).toContain('20%');
    expect(mensajeTopeAumento({ aumentoConTope: true, aumentoTopePorcentaje: 35 })).toContain('35%');
  });
});

describe('aumentosRegistradosGs', () => {
  it('suma en guaraníes solo las líneas de aumento, que se guardan con valor negativo', () => {
    const lineas = [
      { aumento: false, valor: 150000, cambio: 1 },
      { aumento: true, valor: -10000, cambio: 1 },
      { aumento: true, valor: -1, cambio: 7350 },
    ];
    expect(aumentosRegistradosGs(lineas)).toBe(17350);
  });

  it('un segundo aumento se acumula con el primero: dos del 15% no pasan un tope del 20%', () => {
    const yaRegistrado = aumentosRegistradosGs([{ aumento: true, valor: -15000, cambio: 1 }]);
    expect(aumentoPermitido(15000 + yaRegistrado, 100000, null)).toBeFalse();
    expect(aumentoPermitido(5000 + yaRegistrado, 100000, null)).toBeTrue();
  });

  it('sin líneas da 0', () => {
    expect(aumentosRegistradosGs(null)).toBe(0);
    expect(aumentosRegistradosGs([])).toBe(0);
  });
});

describe('tope del descuento', () => {
  const total = 100000;
  const conTope = (pct: number) => ({ descuentoConTope: true, descuentoTopePorcentaje: pct });

  it('sin configuración, o con el dato faltante, no hay tope (como antes)', () => {
    expect(descuentoPermitido(90000, total, null)).toBeTrue();
    expect(descuentoPermitido(90000, total, { aumentoConTope: true, aumentoTopePorcentaje: 20 })).toBeTrue();
    expect(topeDescuento(total, null)).toBeNull();
    expect(descuentoPermitido(90000, total, { descuentoConTope: false, descuentoTopePorcentaje: 5 })).toBeTrue();
  });

  it('justo en el tope se permite y 1 Gs arriba se bloquea', () => {
    expect(descuentoPermitido(10000, total, conTope(10))).toBeTrue();
    expect(descuentoPermitido(10001, total, conTope(10))).toBeFalse();
    expect(topeDescuento(total, conTope(10))).toBe(10000);
  });

  it('con porcentaje inválido cae al 15%, nunca a sin tope', () => {
    expect(topeDescuento(total, { descuentoConTope: true, descuentoTopePorcentaje: 0 })).toBe(15000);
    expect(topeDescuento(total, { descuentoConTope: true, descuentoTopePorcentaje: null })).toBe(15000);
  });

  it('no pierde 1 Gs por punto flotante y respeta decimales de otra moneda', () => {
    expect(descuentoPermitido(33300, total, conTope(33.3))).toBeTrue();
    expect(topeDescuento(10.5, conTope(15))).toBe(1.57);
    expect(descuentoPermitido(1.57, 10.5, conTope(15))).toBeTrue();
    expect(descuentoPermitido(1.58, 10.5, conTope(15))).toBeFalse();
  });

  it('suma los descuentos ya registrados (los de producto incluidos) y no los pagos ni aumentos', () => {
    const lineas = [
      { descuento: true, valor: 3000, cambio: 1 },
      { aumento: true, valor: -500, cambio: 1 },
      { valor: 50000, cambio: 1 },
    ];
    expect(descuentosRegistradosGs(lineas)).toBe(3000);
    expect(descuentosRegistradosGs(lineas, () => 2)).toBe(6000);
    expect(descuentoPermitido(descuentosRegistradosGs(lineas) + 8000, total, conTope(10))).toBeFalse();
    expect(mensajeTopeDescuento(conTope(10))).toContain('10%');
  });
});
