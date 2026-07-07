import { dateToString } from '../../../commons/core/utils/dateUtils';
import { Usuario } from '../../personas/usuarios/usuario.model';

export class Feriado {
  id: number;
  fecha: string;
  descripcion: string;
  esNacional: boolean;
  recargoPorcentaje: number;
  activo: boolean;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): any {
    return {
      id: this.id,
      fecha: this.fecha,
      descripcion: this.descripcion,
      esNacional: this.esNacional,
      recargoPorcentaje: this.recargoPorcentaje,
      activo: this.activo,
      usuarioId: this.usuario?.id
    };
  }
}
