import { EChartsOption } from "echarts";

export interface GraficosDashboardVista {
  cargando: boolean;
  ventasPorSucursal: EChartsOption | null;
  deliveryPorSucursal: EChartsOption | null;
  ventasPorCiudad: EChartsOption | null;
  formasPago: EChartsOption | null;
  gastosCategoria: EChartsOption | null;
  ingresosGastos: EChartsOption | null;
  ventasHora: EChartsOption | null;
  ventasFuncionario: EChartsOption | null;
  productosMasVendidos: EChartsOption | null;
  analisisProducto: EChartsOption | null;
  evolucionCosto: EChartsOption | null;
  rankingInflacion: EChartsOption | null;
}

export const GRAFICOS_DASHBOARD_VISTA_INICIAL: GraficosDashboardVista = {
  cargando: false,
  ventasPorSucursal: null,
  deliveryPorSucursal: null,
  ventasPorCiudad: null,
  formasPago: null,
  gastosCategoria: null,
  ingresosGastos: null,
  ventasHora: null,
  ventasFuncionario: null,
  productosMasVendidos: null,
  analisisProducto: null,
  evolucionCosto: null,
  rankingInflacion: null,
};
