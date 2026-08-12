import { Moneda } from '../../financiero/moneda/moneda.model';
import { Funcionario } from '../../personas/funcionarios/funcionario.model';

export type MotivoEgreso =
  | 'RENUNCIA' | 'DESPIDO_JUSTIFICADO' | 'DESPIDO_INJUSTIFICADO'
  | 'MUTUO_ACUERDO' | 'JUBILACION' | 'FALLECIMIENTO' | 'OTRO';

export type LiquidacionFinalEstado = 'BORRADOR' | 'APROBADA' | 'PAGADA' | 'ANULADA';

export type LiquidacionFinalConcepto = 'INDEMNIZACION' | 'PREAVISO' | 'VACACIONES_NO_GOZADAS' | 'AGUINALDO_PROPORCIONAL' | 'MANUAL';

export type LiquidacionItemTipo = 'HABER' | 'DESCUENTO';

export interface LiquidacionFinalItem {
  id: number;
  concepto?: LiquidacionFinalConcepto;
  descripcion?: string;
  monto?: number;
  tipo?: LiquidacionItemTipo;
  manual?: boolean;
  editado?: boolean;
  editadoPor?: any;
  editadoEn?: any;
  montoOriginal?: number;
}

export interface LiquidacionFinal {
  id: number;
  funcionario?: Funcionario;
  fechaEgreso?: string;
  motivoEgreso?: MotivoEgreso;
  antiguedadDias?: number;
  antiguedadMeses?: number;
  antiguedadAnios?: number;
  salarioPromedio?: number;
  indemnizacionAplica?: boolean;
  indemnizacionMonto?: number;
  diasVacacionesNoGozadas?: number;
  montoVacacionesNoGozadas?: number;
  aguinaldoProporcional?: number;
  preavisoOtorgado?: boolean;
  preavisoDias?: number;
  preavisoMonto?: number;
  preavisoEsDescuento?: boolean;
  totalLiquidado?: number;
  moneda?: Moneda;
  estado?: LiquidacionFinalEstado;
  observacion?: string;
  items?: LiquidacionFinalItem[];
  creadoEn?: Date;
}
