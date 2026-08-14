import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export type HoraExtraTipo = 'DIURNA' | 'NOCTURNA' | 'FERIADO';
export type HoraExtraOrigen = 'JORNADA' | 'MANUAL';

export class HoraExtra {
  id: number;
  funcionario: Funcionario;
  fecha: string;
  jornadaId: number;
  sucursalId: number;
  minutos: number;
  tipo: HoraExtraTipo;
  recargoPorcentaje: number;
  montoCalculado: number;
  origen: HoraExtraOrigen;
  anulada: boolean;
  autorizadoPor: Usuario;
  observacion: string;

  toInput(): any {
    return {
      id: this.id,
      funcionarioId: this.funcionario?.id,
      fecha: this.fecha,
      jornadaId: this.jornadaId,
      sucursalId: this.sucursalId,
      minutos: this.minutos,
      tipo: this.tipo,
      recargoPorcentaje: this.recargoPorcentaje,
      montoCalculado: this.montoCalculado,
      origen: this.origen,
      anulada: this.anulada,
      autorizadoPorId: this.autorizadoPor?.id,
      observacion: this.observacion
    };
  }
}
