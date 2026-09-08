import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { BonoTipo, BonoFrecuencia } from '../bono/bono.model';

export class BonoRecurrente {
  id: number;
  funcionario: Funcionario;
  tipo: BonoTipo;
  monto: number;
  frecuencia: BonoFrecuencia;
  motivo: string;
  activo: boolean;

  toInput(): any {
    return {
      id: this.id,
      funcionarioId: this.funcionario?.id,
      tipo: this.tipo,
      monto: this.monto,
      frecuencia: this.frecuencia,
      motivo: this.motivo,
      activo: this.activo
    };
  }
}
