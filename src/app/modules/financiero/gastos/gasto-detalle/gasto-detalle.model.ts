import { Usuario } from "../../../personas/usuarios/usuario.model"
import { Cambio } from "../../cambio/cambio.model"
import { Moneda } from "../../moneda/moneda.model"
import { Gasto } from "../gastos.model"

export class GastoDetalle {
    id:number
    gasto: Gasto
    moneda: Moneda
    cambio: number
    cantidad: number
    creadoEn: Date
    usuario: Usuario

    toInput(): GastoDetalleInput {
        let input = new GastoDetalleInput;
        input.id = this.id
        input.gastoId = this.gasto?.id
        input.monedaId = this.moneda?.id
        input.cambio = this.cambio
        input.cantidad = this.cantidad
        input.creadoEn = this.creadoEn
        input.usuarioId = this.usuario?.id
        return input;
    }
}

export class GastoDetalleInput {
    id:number
    gastoId: number
    monedaId: number
    cambio: number
    cantidad: number
    creadoEn: Date
    usuarioId: number
}