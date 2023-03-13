import { Usuario } from "../../../personas/usuarios/usuario.model"
import { CobroDetalle, CobroDetalleInput } from "./cobro-detalle.model"

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

    toItemInputList(): CobroDetalleInput[] {
        let itemList: CobroDetalleInput[] = []
        this.cobroDetalleList?.forEach(vi => {
            let viAux = new CobroDetalle;
            Object.assign(viAux, vi)
            itemList.push(viAux.toInput())
        })
        return itemList;
    }
}

export class CobroInput {
    id:Number
    creadoEn: Date
    usuarioId: number
    totalGs: number
    sucursalId: number;
}