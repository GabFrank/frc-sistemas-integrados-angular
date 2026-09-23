import { FormaPago } from "../../../financiero/forma-pago/forma-pago.model"
import { Moneda } from "../../../financiero/moneda/moneda.model"
import { Usuario } from "../../../personas/usuarios/usuario.model"
import { Cobro } from "./cobro.model"
import { TerminalPos } from "../../../financiero/terminal-pos/terminal-pos.model"
import type { DatosCupon } from "../../../financiero/venta-tarjeta/qr-pos/formato-qr-pos.model"

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
    sucursalId: number;

    /**
     * Solo UI, para una línea de forma de pago TARJETA — no viaja al backend (no está en
     * toInput()). Se completa al elegir la terminal y, si el cajero escanea el cupón antes de
     * Finalizar, también queda cargado datosCupon. Sirve para que la tabla de cobro muestre el
     * estado de cada línea (pendiente / registrada) y para reabrir el escaneo desde ahí.
     */
    terminalPos?: TerminalPos;
    datosCupon?: DatosCupon;

    /**
     * La línea se creó EN ESTA SESIÓN de cobro, así que su venta_tarjeta todavía no existe.
     *
     * UI-only, nunca va en toInput(). Al reabrir un delivery, ngOnInit reconstruye las líneas ya
     * cobradas llamando addCobroDetalle: esas ya tienen su registro creado y volver a registrarlas
     * al finalizar duplicaría los pendientes, inflando el cierre de caja con ventas sin registrar
     * que en realidad ya lo están.
     *
     * No alcanza con mirar `id`: en delivery una línea nueva se persiste al agregarla y también
     * termina con id, así que a la hora de finalizar las dos se ven iguales.
     */
    requiereRegistroTarjeta?: boolean;
    
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
        input.sucursalId = this.sucursalId;
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
    sucursalId: number;
}