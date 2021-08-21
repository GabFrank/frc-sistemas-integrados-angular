import { Usuario } from "../../personas/usuarios/usuario.model";
import { Familia } from "../familia/familia.model";
import { Producto } from "../producto/producto.model";

export class Subfamilia {
    id:number;
    nombre: string;
    descripcion: String
    familia: Familia
    subFamilia: Subfamilia
    subfamiliaList: Subfamilia[]
    activo: Boolean
    creadoEn: Date
    usuario: Usuario
    productos: [Producto]
    icono: String
    posicion: String;

}