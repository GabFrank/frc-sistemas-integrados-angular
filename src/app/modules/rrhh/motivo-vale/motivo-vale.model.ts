import { Usuario } from '../../personas/usuarios/usuario.model';

export class MotivoVale {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): any {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      activo: this.activo,
      usuarioId: this.usuario?.id
    };
  }
}
