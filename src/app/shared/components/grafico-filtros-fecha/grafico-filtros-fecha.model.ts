import { RangoFechaPeriodo } from "../../../commons/core/utils/dateUtils";

export interface RangoFechaGrafico extends RangoFechaPeriodo {
  anho: number;
  anhos?: number[];
  mes: number | null;
  fechaDia: Date | null;
  indice?: number;
  etiqueta?: string;
}
