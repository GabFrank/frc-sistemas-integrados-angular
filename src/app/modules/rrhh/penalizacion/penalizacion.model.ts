import { Funcionario } from '../../personas/funcionarios/funcionario.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

export type PenalizacionTipo =
  'TARDANZA' | 'AUSENCIA' | 'QUEJA_CLIENTE' | 'AMBIENTE_LABORAL' |
  'DANIO_MATERIAL' | 'COMISION_DESCUENTO' | 'OTRO';

export class Penalizacion {
  id: number;
  funcionario: Funcionario;
  jornadaId: number;
  sucursalId: number;
  tipo: PenalizacionTipo;
  descripcion: string;
  monto: number;
  fecha: string;
  autoGenerada: boolean;
  anulada: boolean;
  registradoPor: Usuario;

  toInput(): any {
    return {
      id: this.id,
      funcionarioId: this.funcionario?.id,
      jornadaId: this.jornadaId,
      sucursalId: this.sucursalId,
      tipo: this.tipo,
      descripcion: this.descripcion,
      monto: this.monto,
      fecha: this.fecha,
      autoGenerada: this.autoGenerada,
      anulada: this.anulada,
      registradoPorId: this.registradoPor?.id
    };
  }
}
