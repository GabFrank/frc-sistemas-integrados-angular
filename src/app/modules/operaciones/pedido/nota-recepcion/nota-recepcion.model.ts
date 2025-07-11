import { dateToString } from "../../../../commons/core/utils/dateUtils"
import { Moneda } from "../../../financiero/moneda/moneda.model"
import { Documento } from "../../../financiero/documento/documento.model"
import { Usuario } from "../../../personas/usuarios/usuario.model"
import { Compra } from "../../compra/compra.model"
import { PedidoItem } from "../edit-pedido/pedido-item.model"
import { Pedido } from "../edit-pedido/pedido.model"
import { NotaRecepcionEstado } from "./nota-recepcion.enum"

export class NotaRecepcion {
    id:number
    pedido: Pedido
    // notaRecepcionAgrupada: NotaRecepcionAgrupada // ELIMINADO
    compra: Compra
    documento: Documento
    tipoBoleta: string
    valor: number = 0;
    descuento: number
    pagado: boolean
    numero: number
    timbrado: number
    creadoEn: Date
    fecha: Date
    usuario: Usuario
    pedidoItemList: PedidoItem[] = [];
    cantidadItens: number = 0;
    cantidadItensVerificadoRecepcionMercaderia: number = 0;
    cantidadItensNecesitanDistribucion: number;
    // NUEVOS CAMPOS
    moneda: Moneda;
    cotizacion: number;
    estado: NotaRecepcionEstado;

    toInput(): NotaRecepcionInput {
        let input = new NotaRecepcionInput;
        input.id = this.id
        input.numero = this.numero
        input.pagado = this.pagado
        input.timbrado = this.timbrado
        input.valor = this.valor
        input.descuento = this.descuento
        input.documentoId = this.documento?.id
        input.usuarioId = this.usuario?.id
        input.pedidoId = this.pedido?.id
        input.compraId = this.compra?.id
        input.tipoBoleta = this.tipoBoleta
        input.fecha = dateToString(this.fecha)
        input.creadoEn = dateToString(this.creadoEn)
        // Mapeo de campos nuevos ELIMINADO porque no están en el Input del backend
        // input.monedaId = this.moneda?.id;
        // input.cotizacion = this.cotizacion;
        // input.estado = this.estado;
        return input;
    }
}

export class NotaRecepcionInput {
    id:number
    pedidoId: number
    // notaRecepcionAgrupadaId: number // ELIMINADO
    compraId: number
    documentoId: number
    tipoBoleta: string
    valor: number
    descuento: number
    pagado: boolean
    numero: number
    timbrado: number
    creadoEn: string
    fecha: string
    usuarioId: number
    // Campos eliminados para coincidir con el backend:
    // monedaId: number;
    // cotizacion: number;
    // estado: NotaRecepcionEstado;
}