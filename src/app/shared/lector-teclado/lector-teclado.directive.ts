import { Directive, ElementRef, HostListener } from '@angular/core';
import { esTeclaImprimible, rearmarComoLector, TeclaLector } from './teclado-lector';

/**
 * Va en un `<input>` donde escanea el lector de QR. Guarda las teclas físicas de lo que se tipeó y
 * ofrece, con `alternativa()`, la cadena como la quiso mandar el lector (ver `teclado-lector.ts`).
 *
 * Sólo LEE el teclado: nada de `stopPropagation` ni `preventDefault`. Los atajos del PDV (F1, F10,
 * F12) escuchan en `document` y sus guardas dependen de ver estas mismas teclas.
 *
 * El registro tiene que ser íntegro o no sirve. Se invalida ante cualquier cosa que no sea tipear
 * al final de lo que ya hay: Backspace, flechas, pegar, Ctrl/Alt/Meta, un cursor que no está al
 * final, o un valor que cambió por código (`setValue` con texto). Inválido = sin alternativa, y el
 * campo se comporta como siempre.
 */
@Directive({
  selector: '[frcLectorTeclado]',
  exportAs: 'lectorTeclado',
  standalone: true,
})
export class LectorTecladoDirective {
  private teclas: TeclaLector[] = [];
  private integro = true;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): void {
    // Shift sola, Enter del final del lector, Tab: no escriben nada en el campo.
    if (/^(Shift|Control|Alt|Meta|CapsLock)/.test(ev.code) || ev.key === 'Enter' || ev.key === 'Tab') {
      return;
    }
    const input = this.el.nativeElement;
    const valor = input.value || '';

    // ⚠️ El reinicio se decide acá y no en `input`: los diálogos vacían el campo con
    // `setValue('', { emitEvent: false })`, que no dispara ningún evento del DOM.
    if (valor === '') {
      this.teclas = [];
      this.integro = true;
    } else if (valor.length !== this.teclas.length) {
      // Algo escribió el campo sin pasar por acá: un `setValue` con texto, autocompletado, o una
      // tecla muerta que compuso un acento. Las teclas ya no explican el valor.
      this.integro = false;
    }

    if (ev.ctrlKey || ev.altKey || ev.metaKey || ev.isComposing || !esTeclaImprimible(ev.code)) {
      this.integro = false;
      return;
    }
    if (input.selectionStart !== valor.length || input.selectionEnd !== valor.length) {
      this.integro = false;
    }
    this.teclas.push({ code: ev.code, shift: ev.shiftKey });
  }

  @HostListener('paste')
  @HostListener('drop')
  onPegar(): void {
    this.integro = false;
  }

  /**
   * La cadena como la quiso mandar el lector, con el mismo `trim` que aplican los diálogos, o
   * `null` si no hay una confiable o si es igual a la que ya está en el campo.
   */
  alternativa(): string | null {
    const valor = this.el.nativeElement.value || '';
    if (!this.integro || valor.length !== this.teclas.length) return null;
    const rearmada = rearmarComoLector(this.teclas);
    if (rearmada === null || rearmada === valor) return null;
    return rearmada.trim();
  }
}
