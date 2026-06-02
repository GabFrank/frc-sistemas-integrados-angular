/** Formatea un monto según la moneda (guaraní sin decimales, demás con 2). */
export function formatoMontoMoneda(
  valor: number,
  simbolo?: string,
  denominacion?: string
): string {
  const prefijo = (simbolo || "₲").trim();
  const esGuarani =
    !denominacion || denominacion.toUpperCase() === "GUARANI";
  const opciones: Intl.NumberFormatOptions = esGuarani
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  return `${prefijo} ${Number(valor).toLocaleString("es-PY", opciones)}`;
}

/** Etiqueta legible para mostrar en el desglose (ej. Guaraní, Real, Dólar). */
export function etiquetaMoneda(denominacion?: string): string {
  if (!denominacion) {
    return "Moneda";
  }
  const mapa: Record<string, string> = {
    GUARANI: "Guaraní",
    REAL: "Real",
    DOLAR: "Dólar",
    PESO: "Peso",
  };
  const clave = denominacion.toUpperCase();
  return mapa[clave] || denominacion;
}
