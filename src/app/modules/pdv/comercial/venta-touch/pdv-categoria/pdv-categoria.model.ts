import { Usuario } from "../../../../../modules/personas/usuarios/usuario.model";
import { PdvGrupo } from "../pdv-grupo/pdv-grupo.model";

export class PdvCategoria {
    id;
    descripcion;
    activo;
    grupos: PdvGrupo[]
    creadoEn: Date;
    usuario: Usuario;
}