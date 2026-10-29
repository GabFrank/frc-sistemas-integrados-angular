/** Palabras que no son nombre ni apellido (CARLOS DE JESUS VERON → CARLOS JESUS VERON). */
const PARTICULAS = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'DA', 'DOS', 'Y']);
export const MAX_CANDIDATOS_NICKNAME = 6;

/** Mayúsculas y sin tildes, como los nicknames que hay (NÉSTOR → NESTOR); la Ñ se conserva. */
export function normalizarNickname(texto: string): string {
  return (texto ?? '')
    .normalize('NFC')
    .toUpperCase()
    .replace(/Ñ/g, '\u0000')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0000/g, 'Ñ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Nicknames «nombre + apellido» armados con el nombre completo de la persona, sin los de `excluir`.
 * `persona.nombre` no separa nombres de apellidos: la primera mitad se toma como nombres y la segunda
 * como apellidos; con un número impar, la del medio cuenta como las dos (se prueba después).
 */
export function candidatosNickname(nombreCompleto: string, excluir: string[] = []): string[] {
  const palabras = normalizarNickname(nombreCompleto).split(' ').filter(p => p !== '' && !PARTICULAS.has(p));
  const n = palabras.length;
  const finNombres = Math.ceil(n / 2);
  const inicioApellidos = Math.floor(n / 2);
  const pares: string[] = [];
  const agregar = (desde: number, hasta: number) => {
    for (let i = 0; i < finNombres; i++) {
      for (let j = Math.max(desde, i + 1); j < hasta; j++) pares.push(palabras[i] + ' ' + palabras[j]);
    }
  };
  agregar(finNombres, n); // apellidos seguros primero
  agregar(inicioApellidos, finNombres); // la palabra del medio, si es impar
  const excluidos = new Set(excluir.map(normalizarNickname));
  return [...new Set(pares)].filter(p => !excluidos.has(p)).slice(0, MAX_CANDIDATOS_NICKNAME);
}
