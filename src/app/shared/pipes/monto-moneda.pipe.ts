import { Pipe, PipeTransform } from "@angular/core";
import { formatoMontoMoneda } from "../utils/moneda-format.util";

/**
 * Formatea un monto respetando los decimales de su moneda: guaraní sin decimales,
 * el resto con 2. Antepone el símbolo de la moneda.
 *
 * Es un pipe PURO: Angular solo lo re-evalúa cuando cambia alguno de sus argumentos,
 * por lo que puede usarse en celdas de tabla sin el costo de llamar una función
 * desde el template en cada ciclo de change detection.
 *
 * Uso:
 *   {{ pedido?.montoTotal | montoMoneda : pedido?.moneda?.simbolo : pedido?.moneda?.denominacion }}
 *
 * Sin `denominacion` asume guaraní (0 decimales), que es la moneda base del sistema.
 */
@Pipe({
  name: "montoMoneda",
})
export class MontoMonedaPipe implements PipeTransform {
  transform(
    valor: number | null | undefined,
    simbolo?: string | null,
    denominacion?: string | null
  ): string {
    if (valor == null) {
      return "";
    }
    return formatoMontoMoneda(valor, simbolo ?? undefined, denominacion ?? undefined);
  }
}
