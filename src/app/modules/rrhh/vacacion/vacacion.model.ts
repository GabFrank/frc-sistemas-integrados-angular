import { Funcionario } from '../../personas/funcionarios/funcionario.model';

export type VacacionPeriodoEstado = 'SOLICITADA' | 'PROGRAMADA' | 'EN_CURSO' | 'GOZADA' | 'CANCELADA';
export type VacacionVentaEstado = 'PENDIENTE' | 'PAGADO' | 'ANULADO';

export class VacacionPeriodo {
  id: number;
  fechaDesde: string;
  fechaHasta: string;
  diasUsados: number;
  estado: VacacionPeriodoEstado;
  novedadesGeneradas: boolean;
  observacion: string;
}

export class VacacionVenta {
  id: number;
  dias: number;
  monto: number;
  fecha: string;
  estado: VacacionVentaEstado;
  observacion: string;
}

export class Vacacion {
  id: number;
  funcionario: Funcionario;
  anioServicio: number;
  diasGenerados: number;
  diasGozados: number;
  fechaCorte: string;
  prescrita: boolean;
  observacion: string;
}
