import { Usuario } from '../../personas/usuarios/usuario.model';

export type ConfiguracionRrhhTipo = 'NUMBER' | 'STRING' | 'BOOLEAN' | 'DATE';

export class ConfiguracionRrhh {
  id: number;
  clave: string;
  valor: string;
  tipo: ConfiguracionRrhhTipo;
  descripcion: string;
  activo: boolean;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): any {
    return {
      id: this.id,
      clave: this.clave,
      valor: this.valor,
      tipo: this.tipo,
      descripcion: this.descripcion,
      activo: this.activo,
      usuarioId: this.usuario?.id
    };
  }
}
