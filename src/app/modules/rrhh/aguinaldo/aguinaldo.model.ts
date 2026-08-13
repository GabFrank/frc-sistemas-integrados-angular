import { Funcionario } from '../../personas/funcionarios/funcionario.model';

export type AguinaldoEstado = 'CALCULADO' | 'APROBADO' | 'PAGADO';

export class Aguinaldo {
  id: number;
  funcionario: Funcionario;
  anio: number;
  montoCalculado: number;
  mesesTrabajados: number;
  estado: AguinaldoEstado;
  fechaPago: string;
}
