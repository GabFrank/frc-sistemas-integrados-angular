import { EChartsOption } from "echarts";
import { MESES_ETIQUETAS_CORTAS } from "../../../shared/constants/grafico.constants";
import {
  GRAFICO_COLORES,
  GRAFICO_PALETA_BARRAS,
  degradadoBarraVertical,
  ejeCategoriaOscuro,
  ejeValorOscuro,
  formatoEjeCompacto,
  formatoMonedaPy,
  gridGraficoOscuro,
  tituloGraficoCentrado,
  tooltipEjeMoneda,
} from "../../../shared/utils/grafico-echarts.theme";
import { FormaPagoEstadistica } from "../forma-pago/interfaces/forma-pago-estadistica.model";
import { GastoCategoriaItem } from "../gasto-categoria/interfaces/gasto-categoria-item.model";
import { IngresoGastoMesAcumulado } from "../venta-mes/interfaces/ingreso-gasto-mes-acumulado.model";
import { ProductoVendidoEstadistica } from "../producto-vendido/interfaces/producto-vendido-estadistica.model";
import { VentaFuncionarioItem } from "../venta-funcionario/interfaces/venta-funcionario-item.model";
import { VentaSucursalItem } from "../venta-sucursal/venta-sucursal-item.model";
import { VentaCiudadItem } from "../venta-ciudad/venta-ciudad-item.model";
import { VentasPorHoraItem } from "../venta-sucursal/ventas-por-hora-item.model";
import { GraficosDashboardVista } from "./interfaces/graficos-dashboard-vista.model";
import {
  MOCK_FORMAS_PAGO,
  MOCK_GASTOS_CATEGORIA,
  MOCK_GASTOS_MES,
  MOCK_INGRESOS_MES,
  MOCK_PRODUCTOS_BAJA_ROTACION,
  MOCK_PRODUCTOS_TOP,
  MOCK_VENTAS_FUNCIONARIO,
  MOCK_VENTAS_POR_HORA,
  MOCK_VENTAS_POR_SUCURSAL,
  MOCK_DELIVERY_POR_SUCURSAL,
  MOCK_VENTAS_POR_CIUDAD,
  SUBTITULO_VISTA_PREVIA,
} from "./graficos-dashboard-mock.data";

const MESES_ETIQUETAS = [...MESES_ETIQUETAS_CORTAS];

function truncarEtiqueta(texto: string, maximo: number): string {
  if (!texto) {
    return "Sin nombre";
  }
  if (texto.length <= maximo) {
    return texto;
  }
  return `${texto.substring(0, maximo - 2)}…`;
}

export function opcionesVentasPorSucursalMock(
  datos: VentaSucursalItem[]
): EChartsOption {
  const validas = [...datos].sort((a, b) => (b.total || 0) - (a.total || 0));
  const totalGeneral = validas.reduce((sum, item) => sum + (item.total || 0), 0);

  return {
    title: tituloGraficoCentrado(
      "Ventas por Sucursal",
      `${SUBTITULO_VISTA_PREVIA} · ${formatoMonedaPy(totalGeneral)}`
    ),
    tooltip: tooltipEjeMoneda("Ventas"),
    grid: gridGraficoOscuro(),
    xAxis: ejeCategoriaOscuro(
      validas.map((v) => v.nombre || `Suc ${v.sucId}`),
      30
    ),
    yAxis: ejeValorOscuro(),
    series: [
      {
        name: "Ventas",
        type: "bar",
        data: validas.map((v) => v.total),
        itemStyle: {
          color: degradadoBarraVertical(),
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };
}

export function opcionesDeliveryPorSucursalMock(
  datos: VentaSucursalItem[]
): EChartsOption {
  const validas = [...datos].sort((a, b) => (b.total || 0) - (a.total || 0));
  const totalGeneral = validas.reduce((sum, item) => sum + (item.total || 0), 0);

  return {
    title: tituloGraficoCentrado(
      "Ventas con Delivery",
      `${SUBTITULO_VISTA_PREVIA} · ${formatoMonedaPy(totalGeneral)}`
    ),
    tooltip: tooltipEjeMoneda("Delivery"),
    grid: gridGraficoOscuro(),
    xAxis: ejeCategoriaOscuro(
      validas.map((v) => v.nombre || `Suc ${v.sucId}`),
      30
    ),
    yAxis: ejeValorOscuro(),
    series: [
      {
        name: "Delivery",
        type: "bar",
        data: validas.map((v) => v.total),
        itemStyle: {
          color: degradadoBarraVertical(),
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };
}

export function opcionesVentasPorCiudadMock(
  datos: VentaCiudadItem[]
): EChartsOption {
  const validas = [...datos].sort((a, b) => (b.total || 0) - (a.total || 0));
  const totalGeneral = validas.reduce((sum, item) => sum + (item.total || 0), 0);

  return {
    title: tituloGraficoCentrado(
      "Ventas por Ciudad",
      `${SUBTITULO_VISTA_PREVIA} · ${formatoMonedaPy(totalGeneral)}`
    ),
    tooltip: tooltipEjeMoneda("Ventas"),
    grid: gridGraficoOscuro(),
    xAxis: ejeCategoriaOscuro(
      validas.map((v) => v.nombre || `Ciudad ${v.ciudadId ?? ""}`),
      30
    ),
    yAxis: ejeValorOscuro(),
    series: [
      {
        name: "Ventas",
        type: "bar",
        data: validas.map((v) => v.total),
        itemStyle: {
          color: degradadoBarraVertical(),
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };
}

export function opcionesFormasPagoMock(
  estadisticas: FormaPagoEstadistica[]
): EChartsOption {
  const validas = estadisticas.filter((e) => e.cantidadTransacciones > 0);
  const totalMonto = validas.reduce((sum, e) => sum + (e.totalMonto || 0), 0);

  return {
    title: tituloGraficoCentrado(
      "Formas de Pago",
      `${SUBTITULO_VISTA_PREVIA} · ${formatoMonedaPy(totalMonto)}`
    ),
    tooltip: {
      trigger: "item",
      backgroundColor: GRAFICO_COLORES.background,
      borderColor: GRAFICO_COLORES.axisLine,
      textStyle: { color: GRAFICO_COLORES.text },
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number; percent: number };
        return `<strong>${p.name}</strong><br/>Monto: ${formatoMonedaPy(Number(p.value))}<br/>Porcentaje: ${p.percent.toFixed(2)}%`;
      },
    },
    legend: {
      orient: "vertical",
      right: "5%",
      top: "center",
      textStyle: { color: GRAFICO_COLORES.textSecondary },
    },
    series: [
      {
        name: "Forma de Pago",
        type: "pie",
        radius: ["45%", "70%"],
        center: ["40%", "55%"],
        data: validas.map((e, i) => ({
          value: e.totalMonto,
          name: e.descripcion,
          itemStyle: {
            color: GRAFICO_PALETA_BARRAS[i % GRAFICO_PALETA_BARRAS.length],
          },
        })),
      },
    ],
  };
}

export function opcionesGastosCategoriaMock(
  datos: GastoCategoriaItem[]
): EChartsOption {
  const ordenados = [...datos].sort((a, b) => a.total - b.total);

  return {
    title: tituloGraficoCentrado(
      "Gastos por Categoría",
      SUBTITULO_VISTA_PREVIA
    ),
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const fila = Array.isArray(params) ? params[0] : params;
        if (!fila || typeof fila !== "object") {
          return "";
        }
        const p = fila as { name: string; value: number };
        return `${p.name}<br/>Monto: ${formatoMonedaPy(Number(p.value))}`;
      },
    },
    grid: { left: "25%", right: "10%", bottom: "10%", top: "15%" },
    xAxis: {
      type: "value",
      axisLabel: {
        color: GRAFICO_COLORES.textSecondary,
        formatter: (value: number) => formatoEjeCompacto(value),
      },
      splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
    },
    yAxis: {
      type: "category",
      data: ordenados.map((d) => d.categoria || "Sin Categoría"),
      axisLabel: { color: GRAFICO_COLORES.textSecondary },
      splitLine: { show: false },
    },
    series: [
      {
        name: "Gastos",
        type: "bar",
        data: ordenados.map((d) => d.total),
        itemStyle: { color: GRAFICO_COLORES.warn, borderRadius: [0, 4, 4, 0] },
      },
    ],
  };
}

export function opcionesIngresosGastosMock(
  ingresos: IngresoGastoMesAcumulado[],
  gastos: IngresoGastoMesAcumulado[]
): EChartsOption {
  const ingresosData = new Array(12).fill(0);
  const gastosData = new Array(12).fill(0);

  ingresos.forEach((item) => {
    if (item.mes >= 1 && item.mes <= 12) {
      ingresosData[item.mes - 1] = item.total;
    }
  });

  gastos.forEach((item) => {
    if (item.mes >= 1 && item.mes <= 12) {
      gastosData[item.mes - 1] = item.total;
    }
  });

  return {
    title: tituloGraficoCentrado(
      "Ingresos vs Gastos Mensual",
      SUBTITULO_VISTA_PREVIA
    ),
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const filas = Array.isArray(params) ? params : [params];
        if (!filas.length) {
          return "";
        }
        const primera = filas[0] as { name: string };
        let texto = `<strong>${primera.name}</strong><br/>`;
        filas.forEach(
          (fila: { seriesName: string; value: number; marker: string }) => {
            texto += `${fila.marker} ${fila.seriesName}: ${formatoMonedaPy(fila.value)}<br/>`;
          }
        );
        return texto;
      },
    },
    legend: {
      data: ["Ingresos", "Gastos"],
      bottom: 5,
      textStyle: { color: GRAFICO_COLORES.textSecondary },
    },
    grid: gridGraficoOscuro("12%"),
    xAxis: {
      type: "category",
      data: [...MESES_ETIQUETAS],
      axisLabel: { color: GRAFICO_COLORES.textSecondary },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: GRAFICO_COLORES.textSecondary,
        formatter: (value: number) => formatoEjeCompacto(value),
      },
      splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
    },
    series: [
      {
        name: "Ingresos",
        type: "bar",
        data: ingresosData,
        itemStyle: {
          color: GRAFICO_COLORES.primary,
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: "Gastos",
        type: "bar",
        data: gastosData,
        itemStyle: { color: GRAFICO_COLORES.warn, borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
}

export function opcionesVentasPorHoraMock(
  datos: VentasPorHoraItem[]
): EChartsOption {
  const horas = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const valores = new Array(24).fill(0);

  datos.forEach((item) => {
    if (item.hora >= 0 && item.hora <= 23) {
      valores[item.hora] = item.total;
    }
  });

  return {
    title: tituloGraficoCentrado(
      "Ventas por Hora del Día (Hoy)",
      SUBTITULO_VISTA_PREVIA
    ),
    tooltip: {
      trigger: "axis",
      formatter: (params: unknown) => {
        const fila = Array.isArray(params) ? params[0] : params;
        if (!fila || typeof fila !== "object") {
          return "";
        }
        const p = fila as { name: string; value: number };
        return `Hora: ${p.name}:00<br/>Venta: ${formatoMonedaPy(Number(p.value))}`;
      },
    },
    grid: gridGraficoOscuro("3%"),
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: horas,
      axisLabel: { color: GRAFICO_COLORES.textSecondary },
    },
    yAxis: ejeValorOscuro(),
    series: [
      {
        name: "Ventas",
        type: "line",
        smooth: true,
        data: valores,
        areaStyle: { color: "rgba(0, 150, 136, 0.3)" },
        lineStyle: { color: GRAFICO_COLORES.accent, width: 3 },
        itemStyle: { color: GRAFICO_COLORES.accent },
      },
    ],
  };
}

export function opcionesVentasFuncionarioMock(
  datos: VentaFuncionarioItem[]
): EChartsOption {
  const validas = [...datos]
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .slice(0, 10);

  return {
    title: tituloGraficoCentrado(
      "Ventas por Funcionario",
      SUBTITULO_VISTA_PREVIA
    ),
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: unknown) => {
        const fila = Array.isArray(params) ? params[0] : params;
        if (!fila || typeof fila !== "object") {
          return "";
        }
        const p = fila as { name: string; value: number };
        return `${p.name}<br/>Venta: ${formatoMonedaPy(Number(p.value))}`;
      },
    },
    grid: gridGraficoOscuro("3%"),
    xAxis: {
      type: "value",
      axisLabel: {
        color: GRAFICO_COLORES.textSecondary,
        formatter: (value: number) => formatoEjeCompacto(value),
      },
      splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
    },
    yAxis: {
      type: "category",
      data: validas.map((v) => v.funcionario || "Sin nombre"),
      axisLabel: { color: GRAFICO_COLORES.textSecondary },
      inverse: true,
    },
    series: [
      {
        name: "Total",
        type: "bar",
        data: validas.map((v) => v.total ?? 0),
        itemStyle: { color: GRAFICO_COLORES.primary },
      },
    ],
  };
}

export function opcionesProductosMock(
  productos: ProductoVendidoEstadistica[],
  titulo: string,
  colorBarra: string,
  subtextoExtra?: string
): EChartsOption {
  const lista = [...productos].slice(0, 5).reverse();
  const subtexto = subtextoExtra
    ? `${SUBTITULO_VISTA_PREVIA} · ${subtextoExtra}`
    : SUBTITULO_VISTA_PREVIA;

  return {
    title: tituloGraficoCentrado(titulo, subtexto),
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: {
      left: "28%",
      right: "8%",
      bottom: "12%",
      top: subtextoExtra ? "22%" : "18%",
    },
    xAxis: {
      type: "value",
      axisLabel: { color: GRAFICO_COLORES.textSecondary, fontSize: 9 },
    },
    yAxis: {
      type: "category",
      data: lista.map((p) => truncarEtiqueta(p.descripcion, 18)),
      axisLabel: { color: GRAFICO_COLORES.textSecondary, fontSize: 9 },
    },
    series: [
      {
        name: "Cantidad",
        type: "bar",
        data: lista.map((p) => p.cantidad),
        itemStyle: { color: colorBarra, borderRadius: [0, 4, 4, 0] },
      },
    ],
  };
}

export function opcionesEvolucionCostoMock(): EChartsOption {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"];
  const promedio = [8500, 8500, 8900, 9200, 9200, 9800, 10100, 10500];
  const minimo = [8300, 8300, 8600, 8900, 9000, 9400, 9700, 10100];
  const maximo = [8800, 8800, 9300, 9600, 9500, 10200, 10600, 11000];

  return {
    title: tituloGraficoCentrado(
      "Evolución de Costos",
      `${SUBTITULO_VISTA_PREVIA} · +23.5%`
    ),
    tooltip: { trigger: "axis" },
    grid: gridGraficoOscuro("12%"),
    xAxis: ejeCategoriaOscuro(meses),
    yAxis: ejeValorOscuro(),
    series: [
      {
        name: "Costo promedio",
        type: "line",
        data: promedio,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: GRAFICO_COLORES.primary, width: 3 },
        itemStyle: { color: GRAFICO_COLORES.primary },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(104,159,56,0.35)" },
              { offset: 1, color: "rgba(104,159,56,0.02)" },
            ],
          },
        },
      },
      {
        name: "Costo mínimo",
        type: "line",
        data: minimo,
        smooth: true,
        symbol: "none",
        lineStyle: { color: GRAFICO_COLORES.accent, width: 1, type: "dashed" },
      },
      {
        name: "Costo máximo",
        type: "line",
        data: maximo,
        smooth: true,
        symbol: "none",
        lineStyle: { color: GRAFICO_COLORES.warn, width: 1, type: "dashed" },
      },
    ],
  };
}

export function opcionesRankingInflacionMock(): EChartsOption {
  const productos = [
    "Aceite 900ml",
    "Harina 1kg",
    "Azúcar 1kg",
    "Arroz 1kg",
    "Fideo 500g",
    "Leche 1L",
  ];
  const variaciones = [8, 12, 18, 24, 31, 42];

  return {
    title: tituloGraficoCentrado(
      "Inflación de Costos",
      `${SUBTITULO_VISTA_PREVIA} · Mayor suba`
    ),
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "30%", right: "10%", bottom: "5%", top: "18%", containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: {
        color: GRAFICO_COLORES.textSecondary,
        formatter: (v: number) => `${v}%`,
      },
      splitLine: { lineStyle: { color: GRAFICO_COLORES.splitLine } },
    },
    yAxis: {
      type: "category",
      data: productos,
      axisLabel: { color: GRAFICO_COLORES.textSecondary, fontSize: 10 },
    },
    series: [
      {
        name: "Variación",
        type: "bar",
        data: variaciones.map((v) => ({
          value: v,
          itemStyle: { color: GRAFICO_COLORES.warn, borderRadius: [0, 4, 4, 0] },
        })),
      },
    ],
  };
}

export function construirVistaDashboardMock(): GraficosDashboardVista {
  return {
    cargando: false,
    ventasPorSucursal: opcionesVentasPorSucursalMock(MOCK_VENTAS_POR_SUCURSAL),
    deliveryPorSucursal: opcionesDeliveryPorSucursalMock(
      MOCK_DELIVERY_POR_SUCURSAL
    ),
    ventasPorCiudad: opcionesVentasPorCiudadMock(MOCK_VENTAS_POR_CIUDAD),
    formasPago: opcionesFormasPagoMock(MOCK_FORMAS_PAGO),
    gastosCategoria: opcionesGastosCategoriaMock(MOCK_GASTOS_CATEGORIA),
    ingresosGastos: opcionesIngresosGastosMock(
      MOCK_INGRESOS_MES,
      MOCK_GASTOS_MES
    ),
    ventasHora: opcionesVentasPorHoraMock(MOCK_VENTAS_POR_HORA),
    ventasFuncionario: opcionesVentasFuncionarioMock(MOCK_VENTAS_FUNCIONARIO),
    productosMasVendidos: opcionesProductosMock(
      MOCK_PRODUCTOS_TOP,
      "Top Productos Más Vendidos",
      GRAFICO_COLORES.primary
    ),
    analisisProducto: opcionesProductosMock(
      MOCK_PRODUCTOS_BAJA_ROTACION,
      "Análisis de Productos",
      GRAFICO_COLORES.warn,
      "Menor rotación del mes"
    ),
    evolucionCosto: opcionesEvolucionCostoMock(),
    rankingInflacion: opcionesRankingInflacionMock(),
  };
}
