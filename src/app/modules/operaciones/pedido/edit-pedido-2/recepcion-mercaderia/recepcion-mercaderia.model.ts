import { Moneda } from "../../../financiero/moneda/moneda.model";
import { Proveedor } from "../../../personas/proveedor/proveedor.model";
import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { RecepcionMercaderiaEstado } from "./recepcion-mercaderia.enum";
import { RecepcionMercaderiaItem, RecepcionMercaderiaItemInput } from "./recepcion-mercaderia-item.model";
import { NotaRecepcion } from "../nota-recepcion/nota-recepcion.model";
import { RecepcionCostoAdicional, RecepcionCostoAdicionalInput } from "./recepcion-costo-adicional.model";
import { Pedido } from "../edit-pedido/pedido.model";
import { dateToString } from "../../../../../commons/core/utils/dateUtils";

export class RecepcionMercaderia {
    id: number;
    proveedor: Proveedor;
    pedido: Pedido;
    sucursalRecepcion: Sucursal;
    fecha: Date;
    moneda: Moneda;
    cotizacion: number;
    estado: RecepcionMercaderiaEstado;
    usuario: Usuario;
    recepcionMercaderiaItemList: RecepcionMercaderiaItem[];
    notaRecepcionList: NotaRecepcion[];
    recepcionCostoAdicionalList: RecepcionCostoAdicional[];

    toInput(): RecepcionMercaderiaInput {
        const input = new RecepcionMercaderiaInput();
        input.id = this.id;
        input.proveedorId = this.proveedor?.id;
        input.pedidoId = this.pedido?.id;
        input.sucursalRecepcionId = this.sucursalRecepcion?.id;
        input.fecha = dateToString(this.fecha);
        input.monedaId = this.moneda?.id;
        input.cotizacion = this.cotizacion;
        input.estado = this.estado;
        input.usuarioId = this.usuario?.id;
        input.notaRecepcionIds = this.notaRecepcionList?.map(n => n.id);
        input.items = this.recepcionMercaderiaItemList?.map(i => {
            const itemInput = new RecepcionMercaderiaItemInput();
            itemInput.id = i.id;
            itemInput.productoId = i.producto.id;
            itemInput.presentacionId = i.presentacion.id;
            itemInput.pedidoItemId = i.pedidoItem?.id;
            itemInput.cantidad = i.cantidad;
            itemInput.lote = i.lote;
            itemInput.vencimiento = dateToString(i.vencimiento);
            return itemInput;
        });
        input.costosAdicionales = this.recepcionCostoAdicionalList?.map(c => {
            const costoInput = new RecepcionCostoAdicionalInput();
            costoInput.id = c.id;
            costoInput.conceptoId = c.concepto.id;
            costoInput.valor = c.valor;
            return costoInput;
        });
        return input;
    }
}

export class RecepcionMercaderiaInput {
    id?: number;
    proveedorId: number;
    pedidoId: number;
    sucursalRecepcionId: number;
    fecha: string;
    monedaId: number;
    cotizacion: number;
    estado: RecepcionMercaderiaEstado;
    usuarioId: number;
    notaRecepcionIds: number[];
    items: RecepcionMercaderiaItemInput[];
    costosAdicionales: RecepcionCostoAdicionalInput[];
} 