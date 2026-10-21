import { EChartsOption } from "echarts";

export const GRAFICO_COLORES = {
  primary: "#689F38",
  primaryLight: "#8BC34A",
  primaryDark: "#558B2F",
  accent: "#009688",
  accentLight: "#4DB6AC",
  warn: "#F44336",
  warnLight: "#EF5350",
  text: "#E0E0E0",
  textSecondary: "#9E9E9E",
  background: "#424242",
  backgroundDark: "#303030",
  axisLine: "#555555",
  splitLine: "#444444",
  success: "#4CAF50",
  warning: "#FF9800",
  info: "#2196F3",
} as const;

export const GRAFICO_PALETA_BARRAS = [
  "#689F38",
  "#009688",
  "#FF9800",
  "#2196F3",
  "#4DB6AC",
  "#E91E63",
  "#9C27B0",
  "#00BCD4",
] as const;

export function formatoMonedaPy(valor: number): string {
  return `₲ ${Number(valor).toLocaleString("es-PY")}`;
}

export function formatoEjeCompacto(valor: number): string {
  if (valor >= 1_000_000_000) {
    return (valor / 1_000_000_000).toFixed(1) + "KM";
  }
  if (valor >= 1_000_000) {
    return (valor / 1_000_000).toFixed(0) + "M";
  }
  if (valor >= 1_000) {
    return (valor / 1_000).toFixed(0) + "k";
  }
  return valor.toString();
}

export function tituloGraficoCentrado(
  texto: string,
  subtexto?: string
): EChartsOption["title"] {
  return {
    text: texto,
    subtext: subtexto,
    left: "center",
    textStyle: {
      color: GRAFICO_COLORES.text,
      fontSize: 18,
      fontWeight: "bold",
    },
    subtextStyle: {
      color: GRAFICO_COLORES.textSecondary,
      fontSize: 14,
    },
  };
}

export function gridGraficoOscuro(
  bottom = "15%"
): NonNullable<EChartsOption["grid"]> {
  return {
    left: "3%",
    right: "4%",
    bottom,
    containLabel: true,
  };
}

export function ejeCategoriaOscuro(
  data: string[],
  rotate = 0
): NonNullable<EChartsOption["xAxis"]> {
  return {
    type: "category",
    data,
    axisLabel: {
      color: GRAFICO_COLORES.textSecondary,
      rotate,
      interval: 0,
    },
    axisLine: { lineStyle: { color: GRAFICO_COLORES.axisLine } },
  };
}

export function ejeValorOscuro(): NonNullable<EChartsOption["yAxis"]> {
  return {
    type: "value",
    axisLabel: {
      color: GRAFICO_COLORES.textSecondary,
      formatter: (value: number) => formatoEjeCompacto(value),
    },
    splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
  };
}

export function degradadoBarraVertical(): {
  type: "linear";
  x: number;
  y: number;
  x2: number;
  y2: number;
  colorStops: { offset: number; color: string }[];
} {
  return {
    type: "linear",
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: GRAFICO_COLORES.primary },
      { offset: 1, color: GRAFICO_COLORES.primaryDark },
    ],
  };
}

export function tooltipEjeMoneda(
  etiquetaValor = "Ventas"
): NonNullable<EChartsOption["tooltip"]> {
  return {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    formatter: (params: unknown) => {
      const fila = Array.isArray(params) ? params[0] : params;
      if (!fila || typeof fila !== "object") {
        return "";
      }
      const p = fila as { name: string; value: number };
      return `${p.name}<br/>${etiquetaValor}: ${formatoMonedaPy(Number(p.value))}`;
    },
  };
}

/**
 * Grises de GRAFICO_COLORES (pensados para fondo oscuro) y su equivalente en modo claro. ECharts dibuja en
 * canvas y no lee las variables CSS: el cambio se hace sobre las opciones.
 */
const GRISES_MODO_CLARO: Record<string, string> = {
  [GRAFICO_COLORES.text.toLowerCase()]: "#333333",
  [GRAFICO_COLORES.textSecondary.toLowerCase()]: "#616161",
  [GRAFICO_COLORES.background.toLowerCase()]: "#ffffff",
  [GRAFICO_COLORES.backgroundDark.toLowerCase()]: "#f5f5f5",
  [GRAFICO_COLORES.axisLine.toLowerCase()]: "#c4c8ce",
  [GRAFICO_COLORES.splitLine.toLowerCase()]: "#e5e7eb",
};

function aGrisClaro(valor: unknown): unknown {
  if (typeof valor === "string") {
    return GRISES_MODO_CLARO[valor.toLowerCase()] ?? valor;
  }
  if (Array.isArray(valor)) {
    return valor.map(aGrisClaro);
  }
  // Solo objetos planos: funciones (formatters) e instancias (gradientes de echarts) quedan como están.
  if (valor && typeof valor === "object") {
    const proto = Object.getPrototypeOf(valor);
    if (proto === Object.prototype || proto === null) {
      const copia: Record<string, unknown> = {};
      for (const [clave, v] of Object.entries(valor)) {
        copia[clave] = aGrisClaro(v);
      }
      return copia;
    }
  }
  return valor;
}

/** Opciones del gráfico para el tema actual: en modo claro cambia los grises oscuros por claros. */
export function opcionesSegunTema(
  opciones: EChartsOption | null,
  tema: "oscuro" | "claro"
): EChartsOption | null {
  if (!opciones || tema === "oscuro") {
    return opciones;
  }
  return aGrisClaro(opciones) as EChartsOption;
}
