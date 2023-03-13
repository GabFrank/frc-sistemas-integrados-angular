import { Usuario } from "../../../../../modules/personas/usuarios/usuario.model";
import { Producto } from "../../../../../modules/productos/producto/producto.model";
import { PdvGrupo } from "../pdv-grupo/pdv-grupo.model";

export class PdvGruposProductos {
    id;
    pdvGrupo: PdvGrupo;
    producto: Producto;
    activo;
    creadoEn: Date;
    usuario: Usuario;
}