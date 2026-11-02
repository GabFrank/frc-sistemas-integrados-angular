import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";

/**
 * Adapter de fechas para datepickers donde el usuario tipea la fecha.
 *
 * El `NativeDateAdapter` parsea el texto con `Date.parse`, que lo lee como mes/día: `05/06/2027`
 * queda en 6 de mayo y `31/12/2027` es inválida. Este lee día/mes/año, que es como se muestra.
 *
 * Acepta `5/6/2027`, `05-06-27`, `05.06.2027` y también los dígitos seguidos: `05062027`, `050627`.
 * Con año de 2 dígitos se toma 20xx.
 *
 * Se provee a nivel de componente: `providers: [{ provide: DateAdapter, useClass: FechaPyDateAdapter }]`.
 */
@Injectable()
export class FechaPyDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (typeof value === "string") {
      const texto = value.trim();
      const partes =
        texto.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/) ??
        texto.match(/^(\d{2})(\d{2})(\d{2}|\d{4})$/);
      if (partes) {
        const dia = Number(partes[1]);
        const mes = Number(partes[2]);
        const anio = partes[3].length === 2 ? 2000 + Number(partes[3]) : Number(partes[3]);
        const fecha = new Date(anio, mes - 1, dia);
        // `new Date` desborda en silencio (31/02 pasa a marzo): eso es una fecha inválida.
        const existe = fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
        return existe ? fecha : this.invalid();
      }
      // Números a medio escribir (`5/6`, `0506`) no se mandan a `Date.parse`, que inventa un año.
      // El ISO `2027-06-05` sí sigue de largo.
      if (/^[\d\s\/\-.]+$/.test(texto) && !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        return this.invalid();
      }
    }
    return super.parse(value);
  }

  /**
   * La fecha del input se muestra siempre `dd/mm/aaaa` (`02/11/2026`, no `2/11/2026`): es el mismo
   * formato que arma la máscara al tipear. Los textos del calendario (mes, etiquetas) no se tocan.
   */
  override format(date: Date, displayFormat: object): string {
    const f = displayFormat as Intl.DateTimeFormatOptions;
    const soloNumeros =
      f && f.day === "numeric" && f.month === "numeric" && f.year === "numeric" && Object.keys(f).length === 3;
    if (soloNumeros && this.isValid(date)) {
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}/${date.getFullYear()}`;
    }
    return super.format(date, displayFormat);
  }
}
