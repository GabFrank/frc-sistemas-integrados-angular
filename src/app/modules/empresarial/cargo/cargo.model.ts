import { Usuario } from '../../personas/usuarios/usuario.model';

export class Cargo {
  id: number;
  nombre: string;
  descripcion: string;
  supervisadoPor: Cargo;
  sueldoBase: number;
  creadoEn: Date;
  subcargoList: Cargo[];
  usuario: Usuario;

  toInput(): CargoInput {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      sueldoBase: this.sueldoBase,
      supervisadoPorId: this.supervisadoPor?.id,
      usuarioId: this.usuario?.id
    };
  }
}

export interface CargoInput {
  id: number;
  nombre: string;
  descripcion: string;
  sueldoBase: number;
  supervisadoPorId: number;
  usuarioId: number;
}
