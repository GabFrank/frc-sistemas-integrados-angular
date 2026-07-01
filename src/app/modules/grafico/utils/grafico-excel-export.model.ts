import { PeriodoGraficoInput } from "./grafico-periodo.model";

export type GraficoExcelTipo =
  | "VENTA_CIUDAD"
  | "VENTA_SUCURSAL"
  | "VENTA_FUNCIONARIO"
  | "FORMA_PAGO"
  | "GASTO_CATEGORIA"
  | "PRODUCTOS_VENDIDOS"
  | "INGRESO_GASTO"
  | "VENTAS_HORA";

export interface GraficoExcelExportInput {
  periodos?: PeriodoGraficoInput[];
  sucIds?: number[] | null;
  usuarioIds?: number[] | null;
  anios?: number[];
  filtroAnhos?: string;
  filtroMeses?: string;
  filtroRangoDias?: string;
  filtroSucursales?: string;
  filtroExtra?: string;
  limit?: number;
  familiaId?: number | null;
  subfamiliaId?: number | null;
  ascendente?: boolean;
  productoIds?: number[] | null;
}

export interface EtiquetasFiltroGraficoExcel {
  filtroAnhos: string;
  filtroMeses: string;
  filtroRangoDias: string;
  filtroSucursales?: string;
  filtroExtra?: string;
}
