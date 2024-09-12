import { dateToString } from "../../../commons/core/utils/dateUtils";
import { Sucursal } from "../../empresarial/sucursal/sucursal.model";
import { Cobro } from "../../operaciones/venta/cobro/cobro.model";
import { Venta } from "../../operaciones/venta/venta.model";
import { Cliente } from "../../personas/clientes/cliente.model";
import { Usuario } from "../../personas/usuarios/usuario.model";

export class VentaCredito {
    id: number;
    sucursal: Sucursal
    venta: Venta
    cliente: Cliente
    tipoConfirmacion: TipoConfirmacion
    cantidadCuotas: number
    valorTotal: number
    saldoTotal: number
    plazoEnDias: number
    interesPorDia: number
    interesMoraDia: number
    estado: EstadoVentaCredito
    creadoEn: Date
    usuario: Usuario
    fechaCobro: Date


    toInput(): VentaCreditoInput {
        let input = new VentaCreditoInput
        input.id = this.id
        input.sucursalId = this.sucursal?.id
        input.ventaId = this.venta?.id
        input.clienteId = this.cliente?.id
        input.tipoConfirmacion = this.tipoConfirmacion
        input.cantidadCuotas = this.cantidadCuotas
        input.valorTotal = this.valorTotal
        input.saldoTotal = this.saldoTotal
        input.plazoEnDias = this.plazoEnDias
        input.interesPorDia = this.interesPorDia
        input.interesMoraDia = this.interesMoraDia
        input.estado = this.estado
        input.usuarioId = this.usuario?.id
        input.fechaCobro = dateToString(this.fechaCobro)
        return input;
    }
}

export class VentaCreditoInput {
    id: number;
    sucursalId: number
    ventaId: number
    clienteId: number
    tipoConfirmacion: TipoConfirmacion
    cantidadCuotas: number
    valorTotal: number
    saldoTotal: number
    plazoEnDias: number
    interesPorDia: number
    interesMoraDia: number
    estado: EstadoVentaCredito
    usuarioId: number
    fechaCobro: string
}

export class VentaCreditoCuota {
    id: number
    ventaCredito: VentaCredito
    cobro: Cobro
    valor: number
    parcial: boolean
    activo: boolean
    vencimiento: Date
    creadoEn: Date
    usuario: Usuario

    toInput(): VentaCreditoCuotaInput {
        let input = new VentaCreditoCuotaInput
        input.id = this.id
        input.ventaCreditoId = this.ventaCredito?.id
        input.cobroId = this.cobro?.id
        input.valor = this.valor
        input.parcial = this.parcial
        input.activo = this.activo
        input.vencimiento = dateToString(this.vencimiento)
        input.usuarioId = this.usuario?.id
        return input;
    }

}

export class VentaCreditoCuotaInput {
    id: number
    ventaCreditoId: number
    cobroId: number
    valor: number
    parcial: boolean
    activo: boolean
    vencimiento: String
    usuarioId: number
}

export enum TipoConfirmacion {
    CONTRASENA = 'CONTRASENA',
    PASSWORD = 'PASSWORD',
    QR = 'QR',
    LECTOR_HUELLAS = 'LECTOR_HUELLAS',
    FIRMA = 'FIRMA',
    APP = 'APP'
}

export enum EstadoVentaCredito {
    ABIERTO = 'ABIERTO',
    FINALIZADO = 'FINALIZADO',
    EN_MORA = 'EN_MORA',
    INCOBRABLE = 'INCOBRABLE',
    CANCELADO = 'CANCELADO'
}

export class VentaCreditoQRAuthUpdate {
    clienteId: number;
    timestamp: number;
}