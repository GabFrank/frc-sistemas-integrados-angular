import { dateToString } from "../../../commons/core/utils/dateUtils";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../personas/usuarios/usuario.model";

export class Maletin {
    id: number;
    descripcion: string;
    activo: boolean;
    abierto: boolean;
    creadoEn: Date;
    usuario: Usuario;
    cajaActual: Sucursal;
    sucursal: Sucursal;

    toInput(): MaletinInput {
        let input = new MaletinInput;
        input.id = this.id;
        input.descripcion = this.descripcion;
        input.activo = this.activo;
        input.abierto = this.abierto;
        input.creadoEn = dateToString(this.creadoEn);
        input.usuarioId = this.usuario?.id;
        input.sucursalId = this.sucursal?.id;
        return input;
    }
}

export class MaletinInput {
    id: number;
    descripcion: string;
    activo: boolean;
    abierto: boolean;
    creadoEn: string;
    usuarioId: number;
    sucursalId: number;
}

