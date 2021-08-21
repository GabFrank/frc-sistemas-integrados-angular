import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Codigo } from "../codigo/codigo.model";

export class PrecioPorSucursal {
    id: number;
    sucursal: Sucursal;
    codigo: Codigo;
    precio: number;
    creadoEn: Date;
    usuario: Usuario;
}