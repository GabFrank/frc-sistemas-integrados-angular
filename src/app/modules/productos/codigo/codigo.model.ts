import { Usuario } from "../../personas/usuarios/usuario.model";
import { PrecioPorSucursal } from "../precio-por-sucursal/precio-por-sucursal.model";
import { Producto } from "../producto/producto.model";
import { TipoPrecio } from "../tipo-precio/tipo-precio.model";

export class Codigo {
    id: number
    codigo: string;
    producto: Producto;
    cantidad: number;
    principal: boolean;
    descripcion: string;
    caja: boolean;
    tipoPrecio: TipoPrecio;
    usuario: Usuario;
    variacion: boolean
    referenciaCodigo: Codigo;
    preciosPorSucursal: PrecioPorSucursal[];
    activo: boolean;
    creadoEn: Date;
}