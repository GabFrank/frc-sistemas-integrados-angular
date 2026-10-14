export class UsuarioInput {
  id: number;
  personaId: number;
  nickname: string;
  password: string;
  usuarioId: number = null;
  activo: boolean;
  /** Solo lo manda el diálogo de usuario: alta con la clave elegida (central con #477). */
  respetarClave?: boolean;
}
