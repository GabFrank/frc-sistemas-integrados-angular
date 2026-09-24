import { aNumero } from './carga-manual-cupon-dialog.component';

/**
 * Por acá pasan el monto leído del cupón (para compararlo y para guardarlo) y lo cobrado (para
 * compararlo). Los casos salen de los cupones reales: INFONET en guaraníes y PlugPay en dólares
 * (2026-09-24). Los de guaraníes blindan que el arreglo de los dólares no cambió nada ahí.
 */
describe('aNumero (monto del cupón)', () => {
  it('guaraníes con separador de miles, como imprime INFONET', () => {
    expect(aNumero('918.957')).toBe(918957);
    expect(aNumero('3.500')).toBe(3500);
    expect(aNumero('1.500.000')).toBe(1500000);
    expect(aNumero('45000')).toBe(45000);
  });

  it('bordes de guaraníes que tienen que seguir como antes', () => {
    expect(aNumero('-3.500')).toBe(-3500);
    expect(aNumero(' 3.500 ')).toBe(3500);
    expect(aNumero('3.500,')).toBe(3500);
  });

  it('guaraníes con decimales en cero: antes daba 100 veces el monto', () => {
    expect(aNumero('918957.00')).toBe(918957);
  });

  it('una coma sola es decimal, a propósito: es como tipea el cajero en Paraguay', () => {
    // Si el OCR lee una coma donde el papel tiene el punto de miles, sale mal igual que antes
    // del arreglo; lo marca el cruce contra lo cobrado. No "arreglarlo" acá sin mirar la moneda.
    expect(aNumero('3,500')).toBe(3.5);
    expect(aNumero('918,957')).toBe(918.957);
  });

  it('dólares con punto decimal, como imprime PlugPay', () => {
    expect(aNumero('146.50')).toBe(146.5);
    expect(aNumero('156.83')).toBe(156.83);
    expect(aNumero('146.5')).toBe(146.5);
  });

  it('coma decimal, como tipea el cajero', () => {
    expect(aNumero('146,50')).toBe(146.5);
    expect(aNumero('1.500,50')).toBe(1500.5);
  });

  it('importe en inglés de más de mil: el último separador es el decimal', () => {
    expect(aNumero('1,146.50')).toBe(1146.5);
    expect(aNumero('1,146,000')).toBe(1146000);
  });

  it('un número llega como está (mapeo con `escala`)', () => {
    expect(aNumero(146.5)).toBe(146.5);
    expect(aNumero(918957)).toBe(918957);
  });

  it('vacío o ilegible no es un monto', () => {
    expect(aNumero(null)).toBeUndefined();
    expect(aNumero('')).toBeUndefined();
    expect(aNumero('  ')).toBeUndefined();
    expect(aNumero('USD')).toBeUndefined();
  });
});
