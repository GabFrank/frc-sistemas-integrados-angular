import { RangoFechaPeriodo } from "../../../commons/core/utils/dateUtils";

export interface RangoFechaGrafico extends RangoFechaPeriodo {
  anho: number;
  mes: number | null;
  fechaDia: Date | null;
}
