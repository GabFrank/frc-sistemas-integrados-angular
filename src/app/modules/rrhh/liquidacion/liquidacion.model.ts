import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Moneda } from '../../financiero/moneda/moneda.model';

export type LiquidacionSueldoEstado = 'BORRADOR' | 'APROBADA' | 'PAGADA' | 'ANULADA';
export type LiquidacionItemTipo = 'HABER' | 'DESCUENTO';

export class LiquidacionItem {
  id: number;
  codigo: string;
  descripcion: string;
  monto: number;
  tipo: LiquidacionItemTipo;
  referenciaTipo: string;
  manual: boolean;
  editado?: boolean;
  editadoPor?: any;
  editadoEn?: any;
  montoOriginal?: number;
}

export class LiquidacionSueldo {
  id: number;
  funcionario: Funcionario;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  salarioBase: number;
  totalHaberes: number;
  totalDescuentos: number;
  totalNeto: number;
  moneda: Moneda;
  estado: LiquidacionSueldoEstado;
  observacion: string;
  items: LiquidacionItem[];
}
