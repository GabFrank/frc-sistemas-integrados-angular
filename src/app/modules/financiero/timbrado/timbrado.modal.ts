import { Usuario } from "../../personas/usuarios/usuario.model";
import { PuntoDeVenta } from "../punto-de-venta/punto-de-venta.model";

export class Timbrado {
    id: number;
    razonSocial: string
    ruc: string
    numero: string
    fechaInicio: Date
    fechaFin: Date
    activo: boolean
    creadoEn: Date
    usuario: Usuario

    toInput(): TimbradoInput {
        let input = new TimbradoInput;
        input.id = this.id
        input.razonSocial = this.razonSocial
        input.ruc = this.ruc
        input.numero = this.numero
        input.fechaInicio = this.fechaInicio
        input.fechaFin = this.fechaFin
        input.activo = this.activo
        input.usuarioId = this.usuario?.id
        return input;
    }
}

export class TimbradoInput {
    id: number;
    razonSocial: string
    ruc: string
    numero: string
    fechaInicio: Date
    fechaFin: Date
    activo: boolean
    usuarioId: number
}

export class TimbradoDetalle {
    id: number
    timbrado: Timbrado
    puntoDeVenta: PuntoDeVenta
    puntoExpedicion: string
    cantidad: number
    rangoDesde: number
    rangoHasta: number
    numeroActual: number
    activo: boolean
    creadoEn: Date
    usuario: Usuario

    toInput(): TimbradoDetallInput {
        let input = new TimbradoDetallInput;
        input.id = this.id
        input.timbradoId = this.timbrado?.id
        input.puntoDeVentaId = this.puntoDeVenta?.id
        input.puntoExpedicion = this.puntoExpedicion
        input.cantidad = this.cantidad
        input.rangoDesde = this.rangoDesde
        input.rangoHasta = this.rangoHasta
        input.numeroActual = this.numeroActual
        input.activo = this.activo
        input.usuarioId = this.usuario?.id
        return input;
    }
}

export class TimbradoDetallInput {
    id: number
    timbradoId: number
    puntoDeVentaId: number
    puntoExpedicion: string
    cantidad: number
    rangoDesde: number
    rangoHasta: number
    numeroActual: number
    activo: boolean
    usuarioId: number
}