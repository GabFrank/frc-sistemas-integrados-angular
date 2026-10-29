import { Moneda } from "../../../financiero/moneda/moneda.model";
import {
  convertirConRastro,
  RastroPrecio,
} from "../../../productos/precio-por-sucursal/precio-moneda.util";

/**
 * Qué hacer con el precio de un ítem que se agrega al carrito (Fase 3 — precios en otra moneda).
 *  - `empresa`: el precio está en la moneda de la empresa (o no se sabe en cuál): se vende como siempre.
 *  - `convertido`: está en otra moneda y se convirtió a la de cobro; `rastro` viaja con el ítem.
 *  - `sinCotizacion`: está en otra moneda y no hay cotización de esa moneda: no se vende.
 */
export type ResolucionPrecio =
  | { tipo: "empresa" }
  | { tipo: "convertido"; rastro: RastroPrecio; textoLista: string }
  | { tipo: "sinCotizacion"; moneda: Moneda };

/** Cuántos decimales muestra el precio de lista de una moneda. */
function formatearLista(valor: number, moneda: Moneda): string {
  const decimales = moneda?.decimales != null && moneda.decimales > 0 ? moneda.decimales : 0;
  const texto = valor.toLocaleString("es-PY", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  return `${moneda?.simbolo ? moneda.simbolo + " " : ""}${texto}`;
}

/**
 * Función pura: decide cómo se cobra un precio de lista.
 *
 * @param precioId id del precio de venta del ítem
 * @param precioLista valor del precio en SU moneda
 * @param preciosOtraMoneda precioId (texto) → moneda, de `preciosEnOtraMoneda` de la filial; vacío si no hay
 *        ninguno o la filial no conoce la operación
 * @param monedas las monedas con el cambio del comercio (`Moneda.cambio`, guaraníes por unidad)
 * @param monedaCobro la moneda en que se cobra (hoy, la de la empresa)
 */
export function resolverPrecioDeItem(
  precioId: number | string | null | undefined,
  precioLista: number | null | undefined,
  preciosOtraMoneda: Map<string, Moneda>,
  monedas: Moneda[],
  monedaCobro: Moneda | null,
): ResolucionPrecio {
  const monedaPrecio = precioId != null ? preciosOtraMoneda?.get(String(precioId)) : undefined;
  if (monedaPrecio == null || precioLista == null) return { tipo: "empresa" };
  // En otra moneda y sin saber en cuál se cobra: venderlo al valor de lista sería cobrar 4,39 dólares como 4 guaraníes.
  if (monedaCobro == null) return { tipo: "sinCotizacion", moneda: monedaPrecio };
  // La misma moneda que la de cobro: nada que convertir
  if (String(monedaPrecio.id) === String(monedaCobro.id)) return { tipo: "empresa" };

  const buscar = (m: Moneda) => (monedas || []).find((x) => String(x?.id) === String(m?.id));
  const delPrecio = buscar(monedaPrecio);
  const delCobro = buscar(monedaCobro);
  const rastro = convertirConRastro(
    precioLista,
    monedaPrecio.id,
    delPrecio?.cambio,
    delCobro?.cambio,
    delCobro?.decimales ?? monedaCobro.decimales ?? 0,
  );
  if (rastro == null) return { tipo: "sinCotizacion", moneda: delPrecio ?? monedaPrecio };
  return { tipo: "convertido", rastro, textoLista: formatearLista(precioLista, delPrecio ?? monedaPrecio) };
}
