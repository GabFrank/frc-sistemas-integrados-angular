import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export type JornadaNovedadTipo =
  'VACACION' | 'JUSTIFICADO' | 'FERIADO' | 'AUSENCIA_JUSTIFICADA' | 'MEDIA_FALTA';

export class JornadaNovedad {
  id: number;
  funcionario: Funcionario;
  fecha: string;
  tipo: JornadaNovedadTipo;
  jornadaId: number;
  sucursalId: number;
  observacion: string;
  registradoPor: Usuario;

  toInput(): any {
    return {
      id: this.id,
      funcionarioId: this.funcionario?.id,
      fecha: this.fecha,
      tipo: this.tipo,
      jornadaId: this.jornadaId,
      sucursalId: this.sucursalId,
      observacion: this.observacion,
      registradoPorId: this.registradoPor?.id
    };
  }
}
