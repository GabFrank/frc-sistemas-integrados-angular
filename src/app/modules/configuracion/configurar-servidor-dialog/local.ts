import { Usuario } from "../../personas/usuarios/usuario.model";
import { Sucursal } from "./../../empresarial/sucursal/sucursal.model";

export class Local {
    id: number;
    sucursal: Sucursal;
    isServidor: boolean;
    usuario: Usuario;
    creadoEn: Date;
}