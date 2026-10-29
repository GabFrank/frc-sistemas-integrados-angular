import { MatAutocomplete } from '@angular/material/autocomplete';

/**
 * Selector de hora (#523): campo HH:MM con lista desplegable cada 30 min, como el
 * MatTimepicker de Material 19 (este proyecto está en Material 15, que no lo trae).
 * Lo usan "Asignar horario" y "Nuevo horario" de la lista de funcionarios.
 */
export const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;

/** 00:00, 00:30 … 23:30. */
export const OPCIONES_HORA: string[] = Array.from({ length: 48 }, (_, i) =>
  `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

/** Alto de una opción de la lista (mat-option de Material 15). */
const ALTO_OPCION_PX = 48;

/** Al abrir la lista, la deja en la hora del campo (o en las 08:00 si está vacío). */
export function posicionarListaHora(lista: MatAutocomplete, valor: string): void {
  const hora = HORA_VALIDA.test(valor || '') ? valor : '08:00';
  const [h, m] = hora.split(':').map(Number);
  const indice = Math.min(h * 2 + (m >= 30 ? 1 : 0), OPCIONES_HORA.length - 1);
  setTimeout(() => {
    const panel = lista.panel?.nativeElement as HTMLElement;
    if (panel) panel.scrollTop = Math.max(0, (indice - 2) * ALTO_OPCION_PX);
  });
}

/**
 * Lo que se escribe rápido, como HH:MM: "8" → 08:00, "830" o "8.30" → 08:30, "17:5" → 17:05.
 * Devuelve null si no se entiende.
 */
export function normalizarHora(valor: string): string | null {
  const texto = (valor || '').toString().trim();
  if (!texto) return null;
  if (HORA_VALIDA.test(texto)) return texto;
  let h: number, m: number;
  const partes = texto.split(/[:.,\s]/).filter(p => p !== '');
  if (partes.length >= 2) {
    h = Number(partes[0]);
    m = Number(partes[1]);
  } else if (/^\d{1,2}$/.test(texto)) {
    h = Number(texto);
    m = 0;
  } else if (/^\d{3,4}$/.test(texto)) {
    h = Number(texto.slice(0, -2));
    m = Number(texto.slice(-2));
  }
  if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  return null;
}
