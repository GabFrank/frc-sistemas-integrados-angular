import { FormaPago } from "../../financiero/forma-pago/forma-pago.model";
import { PdvCaja } from "../../financiero/pdv/caja/caja.model";
import { Cliente } from "../../personas/clientes/cliente.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Cobro } from "./cobro/cobro.model";
import { VentaEstado } from "./enums/venta-estado.enums";
import { VentaItem, VentaItemInput } from "./venta-item.model";

export class Venta {
    id: number;
    caja: PdvCaja
    cliente: Cliente;
    formaPago: FormaPago;
    estado: VentaEstado;
    creadoEn: Date;
    usuario: Usuario;
    ventaItemList: VentaItem[];
    valorDescuento: number;
    valorTotal: number;
    totalGs: number;
    totalRs: number;
    totalDs: number;
    cobro: Cobro
    sucursalId: number;
    isDelivery: boolean;

    toInput(): VentaInput {
        let input = new VentaInput()
        input.id = this.id;
        input.formaPagoId = this.formaPago?.id;
        input.usuarioId = this.usuario?.id;
        input.totalGs = this.totalGs;
        input.clienteId = this.cliente?.id;
        input.creadoEn = this.creadoEn;
        input.estado = this.estado;
        input.cajaId = this.caja?.id;
        input.totalRs = this.totalRs;
        input.totalDs = this.totalDs;
        input.sucursalId = this.sucursalId;
        return input;
    }

    toItemInputList(): VentaItemInput[] {
        let itemList: VentaItemInput[] = []
        this.ventaItemList?.forEach(vi => {
            let viAux = new VentaItem;
            Object.assign(viAux, vi)
            itemList.push(viAux.toInput())
        })
        return itemList;
    }
}

export class VentaInput {
    id: number;
    clienteId: number;
    cajaId: number;
    formaPagoId: number;
    estado: VentaEstado;
    creadoEn: Date;
    usuarioId: number;
    totalGs: number;
    totalRs: number;
    totalDs: number;
    sucursalId: number;
}

export class VentaPorPeriodo {
    valorGs: number;
    valorRs: number;
    valorDs: number;
    valorTotalGs: number;
    creadoEn: Date;
}