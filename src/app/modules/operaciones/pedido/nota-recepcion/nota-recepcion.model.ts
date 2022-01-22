import { Documento } from "../../../financiero/documento/documento.model"
import { Usuario } from "../../../personas/usuarios/usuario.model"
import { Compra } from "../../compra/compra.model"
import { PedidoItem } from "../edit-pedido/pedido-item.model"
import { Pedido } from "../edit-pedido/pedido.model"

export class NotaRecepcion {
    id:number
    pedido: Pedido
    compra: Compra
    documento: Documento
    valor: number
    descuento: number
    pagado: boolean
    numero: number
    timbrado: number
    creadoEn: Date
    usuario: Usuario
    pedidoItemList: PedidoItem[] = [];

    toInput(): NotaRecepcionInput {
        let input = new NotaRecepcionInput;
        input.id = this.id
        input.numero = this.numero
        input.pagado = this.pagado
        input.timbrado = this.timbrado
        input.valor = this.valor
        input.descuento = this.descuento
        input.documentoId = this.documento?.id
        input.creadoEn = this.creadoEn
        input.usuarioId = this.usuario?.id
        input.pedidoId = this.pedido?.id
        input.compraId = this.compra?.id
        return input;
    }
}

export class NotaRecepcionInput {
    id:number
    pedidoId: number
    compraId: number
    documentoId: number
    valor: number
    descuento: number
    pagado: boolean
    numero: number
    timbrado: number
    creadoEn: Date
    usuarioId: number
}