import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model"
import { Moneda } from "../../../financiero/moneda/moneda.model"
import { Usuario } from "../../../personas/usuarios/usuario.model"
import { Cobro } from "./cobro.model"

export class CobroDetalle {
    id: number
    cobro: Cobro
    moneda: Moneda
    cambio: number
    formaPago: FormaPago
    valor: number
    descuento: boolean
    aumento: boolean
    vuelto: boolean
    pago: boolean
    creadoEn: Date
    usuario: Usuario
    identificadorTransaccion: string

    toInput(): CobroDetalleInput {
        let input = new CobroDetalleInput()
        input.id = this.id;
        input.cobroId = this.cobro?.id
        input.monedaId = this.moneda?.id
        input.cambio = this.cambio
        input.formaPagoId = this.formaPago?.id
        input.valor = this.valor
        input.descuento = this.descuento
        input.aumento = this.aumento
        input.pago = this.pago
        input.vuelto = this.vuelto;
        input.creadoEn = this.creadoEn
        input.usuarioId = this.usuario?.id;
        input.identificadorTransaccion = this.identificadorTransaccion;
        return input;
    }
}

export class CobroDetalleInput {
    id: number
    cobroId: number
    monedaId: number
    cambio: number
    formaPagoId: number
    valor: number
    descuento: boolean
    aumento: boolean
    vuelto: boolean
    pago: boolean
    creadoEn: Date
    usuarioId: number
    identificadorTransaccion: string
}