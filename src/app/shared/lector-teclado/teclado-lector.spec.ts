import { ElementRef } from '@angular/core';
import { LectorTecladoDirective } from './lector-teclado.directive';
import { caracterDelLector, lecturasAProbar, rearmarComoLector, TeclaLector } from './teclado-lector';

/**
 * Las tres lecturas medidas el 2026-10-05 con el lector del PDV
 * (`desktop/docs/utilitarios/diagnostico-lector-teclado.html`): lo que el lector mandó y lo
 * que tipeó Windows con el teclado en español latinoamericano.
 */
const CUPON = 'FRCP1*CXF1**BRL*9455*E60701190202608271700DY5BCKNPMBQ*202608271401';
const CUPON_ES = 'FRCP1(CXF1((BRL(9455(E60701190202608271700DY5BCKNPMBQ(202608271401';
const SENA = 'frc-24-VT-35518-35518-RegistroVentaTarjetaComponent-654|32000|36-1789585591133';
const SENA_ES = "frc'24'VT'35518'35518'RegistroVentaTarjetaComponent'654]32000]36'1789585591133";

/** Las teclas que manda el lector (tabla EE.UU.) para tipear `s`. */
const INVERSA: { [c: string]: TeclaLector } = {};
'abcdefghijklmnopqrstuvwxyz'.split('').forEach((l) => {
  INVERSA[l] = { code: 'Key' + l.toUpperCase(), shift: false };
  INVERSA[l.toUpperCase()] = { code: 'Key' + l.toUpperCase(), shift: true };
});
'1234567890'.split('').forEach((d) => (INVERSA[d] = { code: 'Digit' + d, shift: false }));
INVERSA['*'] = { code: 'Digit8', shift: true };
INVERSA['-'] = { code: 'Minus', shift: false };
INVERSA['|'] = { code: 'Backslash', shift: true };
const teclasDe = (s: string): TeclaLector[] => s.split('').map((c) => INVERSA[c]);

/** Un input falso: la directiva sólo mira `value`, `selectionStart` y `selectionEnd`. */
function campo() {
  const input: any = { value: '', selectionStart: 0, selectionEnd: 0 };
  const directiva = new LectorTecladoDirective(new ElementRef(input));
  /** Lo que pasa cuando el lector manda una tecla y Windows escribe `escrito`. */
  const tecla = (t: TeclaLector, escrito: string, extra: any = {}) => {
    directiva.onKeydown({ code: t.code, shiftKey: t.shift, key: escrito, ...extra } as any);
    input.value += escrito;
    input.selectionStart = input.selectionEnd = input.value.length;
  };
  /** Escanea `enviada`, con Windows tipeando `recibida` (mismo largo). */
  const escanear = (enviada: string, recibida: string) =>
    teclasDe(enviada).forEach((t, i) => tecla(t, recibida.charAt(i)));
  return { input, directiva, tecla, escanear };
}

describe('teclado-lector', () => {
  it('traduce las teclas del lector con tabla EE.UU.', () => {
    expect(caracterDelLector({ code: 'Digit8', shift: true })).toBe('*');
    expect(caracterDelLector({ code: 'Minus', shift: false })).toBe('-');
    expect(caracterDelLector({ code: 'Backslash', shift: true })).toBe('|');
    expect(caracterDelLector({ code: 'KeyQ', shift: false })).toBe('q');
    expect(caracterDelLector({ code: 'NumpadMultiply', shift: false })).toBe('*');
    expect(caracterDelLector({ code: 'Backspace', shift: false })).toBeNull();
  });

  it('rearma las lecturas medidas', () => {
    expect(rearmarComoLector(teclasDe(CUPON))).toBe(CUPON);
    expect(rearmarComoLector(teclasDe(SENA))).toBe(SENA);
  });

  it('sin una tecla traducible no hay rearmada', () => {
    expect(rearmarComoLector([{ code: 'KeyA', shift: false }, { code: 'Backspace', shift: false }])).toBeNull();
  });

  it('prueba primero la original y la rearmada sólo si difiere', () => {
    expect(lecturasAProbar('A', 'B')).toEqual(['A', 'B']);
    expect(lecturasAProbar('A', 'A')).toEqual(['A']);
    expect(lecturasAProbar('A', null)).toEqual(['A']);
  });
});

describe('LectorTecladoDirective', () => {
  it('recupera el cupón y la seña que Windows en español rompió', () => {
    const c = campo();
    c.escanear(CUPON, CUPON_ES);
    expect(c.input.value).toBe(CUPON_ES);
    expect(c.directiva.alternativa()).toBe(CUPON);

    const s = campo();
    s.escanear(SENA, SENA_ES);
    expect(s.directiva.alternativa()).toBe(SENA);
  });

  it('con Windows en inglés no ofrece nada: ya llegó bien', () => {
    const c = campo();
    c.escanear(CUPON, CUPON);
    expect(c.directiva.alternativa()).toBeNull();
  });

  it('reinicia al escanear de nuevo sobre el campo vaciado por código', () => {
    const c = campo();
    c.escanear(SENA, SENA_ES);
    // setValue('', { emitEvent: false }): el DOM deja el cursor en 0.
    c.input.value = '';
    c.input.selectionStart = c.input.selectionEnd = 0;
    c.escanear(CUPON, CUPON_ES);
    expect(c.directiva.alternativa()).toBe(CUPON);
  });

  it('un segundo escaneo sobre texto que puso el código invalida', () => {
    const c = campo();
    c.input.value = 'ABC'; // setValue('ABC') sin teclas
    c.input.selectionStart = c.input.selectionEnd = 3;
    c.escanear(CUPON, CUPON_ES);
    expect(c.directiva.alternativa()).toBeNull();
  });

  it('Backspace, pegar, Ctrl y cursor en el medio invalidan', () => {
    const borrar = campo();
    borrar.escanear('FRCP1*', 'FRCP1(');
    borrar.directiva.onKeydown({ code: 'Backspace', key: 'Backspace' } as any);
    expect(borrar.directiva.alternativa()).toBeNull();

    const pegar = campo();
    pegar.escanear('FRCP1*', 'FRCP1(');
    pegar.directiva.onPegar();
    expect(pegar.directiva.alternativa()).toBeNull();

    const ctrl = campo();
    ctrl.escanear('FRCP1', 'FRCP1');
    ctrl.tecla({ code: 'KeyV', shift: false }, '*', { ctrlKey: true });
    expect(ctrl.directiva.alternativa()).toBeNull();

    const medio = campo();
    medio.escanear('FRCP1', 'FRCP1');
    medio.input.selectionStart = medio.input.selectionEnd = 2;
    medio.directiva.onKeydown({ code: 'Digit8', shiftKey: true, key: '(' } as any);
    expect(medio.directiva.alternativa()).toBeNull();
  });

  it('una tecla muerta que no escribió nada desfasa el largo e invalida', () => {
    const c = campo();
    c.escanear('FRC', 'FRC');
    c.directiva.onKeydown({ code: 'BracketLeft', shiftKey: false, key: 'Dead' } as any); // ´ sin escribir
    c.tecla({ code: 'KeyA', shift: false }, 'á');
    expect(c.directiva.alternativa()).toBeNull();
  });

  it('Shift, Enter y Tab no cuentan como teclas', () => {
    const c = campo();
    c.directiva.onKeydown({ code: 'ShiftLeft', key: 'Shift' } as any);
    c.escanear(CUPON, CUPON_ES);
    c.directiva.onKeydown({ code: 'Enter', key: 'Enter' } as any);
    expect(c.directiva.alternativa()).toBe(CUPON);
  });
});
