import { Usuario } from "../../personas/usuarios/usuario.model";

export class BancoInput {
  id: number;
  nombre: string;
  codigo: string;
  creadoEn: Date;
  usuarioId: number;
}
