/**
 * Rearma lo que mandó el lector de QR a partir de las teclas físicas, sin depender del idioma de
 * teclado de Windows.
 *
 * El lector del PDV es keyboard-wedge: no manda caracteres, manda TECLAS según la tabla de teclado
 * que tiene configurada adentro, y el carácter final lo decide el idioma de Windows. Medido el
 * 2026-10-05 (`desktop/docs/utilitarios/diagnostico-lector-teclado.html`): la tabla del lector
 * es EE.UU. --el `|` llega como Shift+Backslash, que en ABNT2 estaría en IntlBackslash--, así que
 * con Windows en español el `*` del cupón FRCP1 llega como `(` y el `-` de la seña como `'`. En
 * portugués de Brasil el cupón pasaba y la seña no (`|` → `}`). El cajero veía «no corresponde a
 * ningún formato conocido» con un cupón perfecto en la mano.
 *
 * `KeyboardEvent.code` nombra la tecla física, no el carácter: con eso y la tabla de abajo se
 * recupera lo que el lector quiso mandar en cualquier idioma.
 */

/** Una tecla tal como la mandó el lector: la tecla física y si iba con Shift. */
export interface TeclaLector {
  code: string;
  shift: boolean;
}

/**
 * La tabla interna del lector (EE.UU.): tecla física → [sin Shift, con Shift]. Letras y espacio se
 * resuelven aparte. Si algún día aparece un lector configurado con otra tabla, se mide con la
 * página de diagnóstico y se agrega acá; no se adivina.
 */
const TABLA_EEUU: { [code: string]: string } = {
  Digit1: '1!', Digit2: '2@', Digit3: '3#', Digit4: '4$', Digit5: '5%',
  Digit6: '6^', Digit7: '7&', Digit8: '8*', Digit9: '9(', Digit0: '0)',
  Minus: '-_', Equal: '=+', BracketLeft: '[{', BracketRight: ']}', Backslash: '\\|',
  IntlBackslash: '\\|', Semicolon: ';:', Quote: '\'"', Backquote: '`~',
  Comma: ',<', Period: '.>', Slash: '/?',
};

/**
 * El teclado numérico no cambia con el idioma ni con Shift. Con NumLock apagado esas teclas no
 * escriben nada: el largo deja de coincidir y la directiva descarta la rearmada.
 */
const NUMPAD: { [code: string]: string } = {
  Numpad0: '0', Numpad1: '1', Numpad2: '2', Numpad3: '3', Numpad4: '4',
  Numpad5: '5', Numpad6: '6', Numpad7: '7', Numpad8: '8', Numpad9: '9',
  NumpadMultiply: '*', NumpadAdd: '+', NumpadSubtract: '-', NumpadDivide: '/', NumpadDecimal: '.',
};

/** El carácter que el lector quiso mandar con esa tecla, o `null` si la tecla no es imprimible. */
export function caracterDelLector(tecla: TeclaLector): string | null {
  const code = tecla?.code || '';
  if (/^Key[A-Z]$/.test(code)) {
    const letra = code.charAt(3);
    return tecla.shift ? letra : letra.toLowerCase();
  }
  if (code === 'Space') return ' ';
  if (NUMPAD[code] !== undefined) return NUMPAD[code];
  const par = TABLA_EEUU[code];
  if (par === undefined) return null;
  return tecla.shift ? par.charAt(1) : par.charAt(0);
}

export function esTeclaImprimible(code: string): boolean {
  return caracterDelLector({ code, shift: false }) !== null;
}

/**
 * La cadena que el lector quiso mandar, o `null` si alguna tecla no se puede traducir: ante la
 * duda no hay alternativa, y queda lo que tipeó Windows.
 */
export function rearmarComoLector(teclas: TeclaLector[]): string | null {
  let s = '';
  for (const t of teclas || []) {
    const c = caracterDelLector(t);
    if (c === null) return null;
    s += c;
  }
  return s;
}

/**
 * Las lecturas a probar, en orden: primero la que llegó --la de un cajero que tipea a mano en su
 * propio teclado, que no debe cambiar de comportamiento-- y después la rearmada, sólo si difiere.
 */
export function lecturasAProbar(original: string, alternativa?: string | null): string[] {
  const lecturas = [original];
  if (alternativa && alternativa !== original) lecturas.push(alternativa);
  return lecturas;
}
