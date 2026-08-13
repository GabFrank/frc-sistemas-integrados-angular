import { Funcionario } from '../../personas/funcionarios/funcionario.model';

export type BonoTipo = 'CUMPLEANIOS' | 'NAVIDAD' | 'DESEMPENIO' | 'PRODUCTIVIDAD' | 'OTRO';
export type BonoFrecuencia = 'SEMANAL' | 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export class Bono {
  id: number;
  funcionario: Funcionario;
  tipo: BonoTipo;
  monto: number;
  fecha: string;
  motivo: string;
  esRecurrente: boolean;
  frecuencia: BonoFrecuencia;
  anulado: boolean;

  toInput(): any {
    return {
      id: this.id,
      funcionarioId: this.funcionario?.id,
      tipo: this.tipo,
      monto: this.monto,
      fecha: this.fecha,
      motivo: this.motivo,
      esRecurrente: this.esRecurrente,
      frecuencia: this.frecuencia
    };
  }
}
