import { Injectable } from "@angular/core";
import { NativeDateAdapter } from "@angular/material/core";

/**
 * Adapter de fechas para datepickers donde el usuario tipea la fecha.
 *
 * El `NativeDateAdapter` parsea el texto con `Date.parse`, que lo lee como mes/día: `05/06/2027`
 * queda en 6 de mayo y `31/12/2027` es inválida. Este lee día/mes/año, que es como se muestra.
 *
 * Se provee a nivel de componente: `providers: [{ provide: DateAdapter, useClass: FechaPyDateAdapter }]`.
 */
@Injectable()
export class FechaPyDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if (typeof value === "string") {
      const partes = value.trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2}|\d{4})$/);
      if (partes) {
        const dia = Number(partes[1]);
        const mes = Number(partes[2]);
        const anio = partes[3].length === 2 ? 2000 + Number(partes[3]) : Number(partes[3]);
        const fecha = new Date(anio, mes - 1, dia);
        // `new Date` desborda en silencio (31/02 pasa a marzo): eso es una fecha inválida.
        const existe = fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia;
        return existe ? fecha : this.invalid();
      }
    }
    return super.parse(value);
  }
}
