import { Usuario } from "../../../personas/usuarios/usuario.model"
import { CobroDetalle } from "./cobro-detalle.model"

export class Cobro {
    id: number
    creadoEn: Date
    usuario: Usuario
    totalGs: number
    cobroDetalleList: CobroDetalle[]
    sucursalId: number;

    toInput(): CobroInput {
        let input = new CobroInput()
        input.id = this.id;
        input.creadoEn = this.creadoEn
        input.totalGs = this.totalGs;
        input.usuarioId = this.usuario?.id;
        input.sucursalId = this.sucursalId
        return input;
    }
}

export class CobroInput {
    id:Number
    creadoEn: Date
    usuarioId: number
    totalGs: number
    sucursalId: number;
}