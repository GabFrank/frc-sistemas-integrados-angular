import { Usuario } from "../../../../../modules/personas/usuarios/usuario.model";
import { PdvCategoria } from "../pdv-categoria/pdv-categoria.model";
import { PdvGruposProductos } from "../pdv-grupos-productos/pdv-grupos-productos.model";

export class PdvGrupo {
    id;
    descripcion;
    activo;
    pdvCategoria: PdvCategoria;
    pdvGruposProductos: PdvGruposProductos[];
    creadoEn: Date;
    usuario: Usuario;
}