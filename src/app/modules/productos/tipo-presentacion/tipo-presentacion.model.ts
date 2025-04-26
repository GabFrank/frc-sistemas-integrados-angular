import { Usuario } from "../../personas/usuarios/usuario.model";

export class TipoPresentacion {
  id: number
  descripcion: string
  unico: boolean
  creadoEn: Date
  usuario: Usuario
}
