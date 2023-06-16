import { Usuario } from "../../personas/usuarios/usuario.model";
import { Familia } from "../familia/familia.model";
import { Producto } from "../producto/producto.model";

export class Subfamilia {
    id:number;
    nombre: string;
    descripcion: string
    familia: Familia
    subFamilia: Subfamilia
    subfamiliaList: Subfamilia[]
    activo: boolean
    creadoEn: Date
    usuario: Usuario
    productos: [Producto]
    icono: string
    posicion: string;

}
