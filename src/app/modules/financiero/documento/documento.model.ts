import { Usuario } from "../../personas/usuarios/usuario.model";

export class Documento {
  id: number;
  descripcion: string;
  activo: boolean;
  creadoEn: Date;
  usuario: Usuario;

  toInput(): DocumentoInput {
    let input = new DocumentoInput();
    input.id = this.id;
    input.descripcion = this.descripcion;
    input.activo = this.activo;
    input.creadoEn = this.creadoEn;
    input.usuarioId = this.usuario?.id;
    return input;
  }
}

export class DocumentoInput {
  id: number;
  descripcion: string;
  activo: boolean;
  creadoEn: Date;
  usuarioId: number;
}
