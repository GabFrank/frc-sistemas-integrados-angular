import { Sucursal } from "../../empresarial/sucursal/sucursal.model"
import { Usuario } from "../../personas/usuarios/usuario.model"

export class PuntoDeVenta {
    id: number
    sucursal: Sucursal
    nombre: string
    nombreImpresoraTicket: string
    tamanhoImpresoraTicket: string
    nombreImpresoraReportes: string
    creadoEn: Date
    usuario: Usuario

    toInput(): PuntoDeVentaInput {
        let input = new PuntoDeVentaInput()
        input.id = this.id
        input.sucursalId = this.sucursal?.id
        input.nombre = this.nombre
        input.nombreImpresoraTicket = this.nombreImpresoraTicket
        input.tamanhoImpresoraTicket = this.tamanhoImpresoraTicket
        input.nombreImpresoraReportes = this.nombreImpresoraReportes
        input.usuarioId = this.usuario?.id
        return input;
    }
}

export class PuntoDeVentaInput {
    id: number
    sucursalId: number
    nombre: string
    nombreImpresoraTicket: string
    tamanhoImpresoraTicket: string
    nombreImpresoraReportes: string
    usuarioId: number
}