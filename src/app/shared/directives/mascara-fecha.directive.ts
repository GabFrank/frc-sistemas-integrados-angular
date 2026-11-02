import { Directive, ElementRef, HostListener } from "@angular/core";

/** Fecha ya escrita con sus separadores (`5/6/2027`, `05-06-27`): se deja como está. */
const FECHA_CON_SEPARADORES = /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/;

/**
 * Máscara `dd/mm/aaaa` para un input de fecha tipeable: se escriben solo los números y las barras
 * se ponen solas (`02112026` → `02/11/2026`). Va junto a `[matDatepicker]` con `FechaPyDateAdapter`,
 * que muestra las fechas con ese mismo formato.
 *
 * La barra aparece recién cuando llega el dígito siguiente (`05` queda `05`, `053` pasa a `05/3`):
 * así Backspace no se traba contra una barra puesta de antemano.
 *
 * Reescribe el valor y vuelve a disparar `input` para que el datepicker lea el texto con barras.
 * El segundo pasaje ya viene formateado y no hace nada: no hay bucle.
 */
@Directive({
  selector: "input[frcMascaraFecha]",
  standalone: true,
})
export class MascaraFechaDirective {
  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener("input")
  onInput(): void {
    const input = this.el.nativeElement;
    const actual = input.value;
    if (FECHA_CON_SEPARADORES.test(actual.trim())) {
      return;
    }
    const digitos = actual.replace(/\D/g, "").slice(0, 8);
    const formateado = MascaraFechaDirective.formatear(digitos);
    if (formateado === actual) {
      return;
    }

    // El cursor queda detrás de la misma cantidad de dígitos que tenía antes.
    const cursor = input.selectionStart ?? actual.length;
    const digitosAntes = actual.slice(0, cursor).replace(/\D/g, "").length;

    input.value = formateado;
    const posicion = MascaraFechaDirective.posicionTrasDigitos(formateado, digitosAntes);
    input.setSelectionRange(posicion, posicion);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  static formatear(digitos: string): string {
    if (digitos.length <= 2) {
      return digitos;
    }
    if (digitos.length <= 4) {
      return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    }
    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
  }

  private static posicionTrasDigitos(texto: string, digitos: number): number {
    if (digitos <= 0) {
      return 0;
    }
    let vistos = 0;
    for (let i = 0; i < texto.length; i++) {
      if (/\d/.test(texto[i]) && ++vistos === digitos) {
        return i + 1;
      }
    }
    return texto.length;
  }
}
