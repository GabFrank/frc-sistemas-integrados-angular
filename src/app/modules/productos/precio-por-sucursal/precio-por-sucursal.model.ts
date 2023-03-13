import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Codigo } from "../codigo/codigo.model";
import { Presentacion } from "../presentacion/presentacion.model";
import { TipoPrecio } from "../tipo-precio/tipo-precio.model";

export class PrecioPorSucursal {
    id: number;
    sucursal: Sucursal;
    presentacion: Presentacion;
    tipoPrecio: TipoPrecio
    precio: number;
    creadoEn: Date;
    usuario: Usuario;
    principal: boolean;
    activo: boolean;
}