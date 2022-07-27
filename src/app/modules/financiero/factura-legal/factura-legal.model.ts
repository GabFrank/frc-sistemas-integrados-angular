import { VentaItem } from "../../operaciones/venta/venta-item.model"
import { Venta } from "../../operaciones/venta/venta.model"
import { Cliente } from "../../personas/clientes/cliente.model"
import { Usuario } from "../../personas/usuarios/usuario.model"

export class FacturaLegal {
    id: number
    timbrado: string
    nroSucursal: string
    nroFactura: string
    cliente: Cliente
    venta: Venta
    fecha: Date
    credito: boolean
    nombre: string
    ruc: string
    direccion: string
    ivaParcial0: number
    ivaParcial5: number
    ivaParcial10: number
    totalParcial0: number
    totalParcial5: number
    totalParcial10: number
    totalFinal: number
    usuario: Usuario
    creadoEn: Date

    toInput(): FacturaLegalInput {
        let input = new FacturaLegalInput;
        input.id = this.id
        input.timbrado = this.timbrado
        input.nroSucursal = this.nroSucursal
        input.nroFactura = this.nroFactura
        input.clienteId = this.cliente?.id
        input.ventaId = this.venta?.id
        input.fecha = this.fecha
        input.credito = this.credito
        input.nombre = this.nombre
        input.ruc = this.ruc
        input.direccion = this.direccion
        input.ivaParcial0 = this.ivaParcial0
        input.ivaParcial5 = this.ivaParcial5
        input.ivaParcial10 = this.ivaParcial10
        input.totalParcial0 = this.totalParcial0
        input.totalParcial5 = this.totalParcial5
        input.totalParcial10 = this.totalParcial10
        input.totalFinal = this.totalFinal
        input.usuarioId = this.usuario?.id
        return input;
    }
}

export class FacturaLegalInput {
    id: number
    timbrado: string
    nroSucursal: string
    nroFactura: string
    clienteId: number
    ventaId: number
    fecha: Date
    credito: boolean
    nombre: string
    ruc: string
    direccion: string
    ivaParcial0: number
    ivaParcial5: number
    ivaParcial10: number
    totalParcial0: number
    totalParcial5: number
    totalParcial10: number
    totalFinal: number
    usuarioId: number
}

export class FacturaLegalItem {
    id: number
    facturaLegal: FacturaLegal
    ventaItem: VentaItem
    cantidad: number
    descripcion: string
    precioUnitario: number
    total: number
    creadoEn: Date
    usuario: Usuario

    toInput(): FacturaLegalItemInput {
        let input = new FacturaLegalItemInput;
        input.id = this.id
        input.facturaLegalId = this.facturaLegal?.id
        input.ventaItemId = this.ventaItem?.id
        input.cantidad = this.cantidad
        input.descripcion = this.descripcion
        input.precioUnitario = this.precioUnitario
        input.total = this.total
        input.creadoEn = this.creadoEn
        input.usuarioId = this.usuario.id
        return input;
    }
}

export class FacturaLegalItemInput {
    id: number
    facturaLegalId: number
    ventaItemId: number
    cantidad: number
    descripcion: string
    precioUnitario: number
    total: number
    creadoEn: Date
    usuarioId: number
}