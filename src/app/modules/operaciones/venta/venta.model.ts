import { FormaPago } from "../../financiero/forma-pago/forma-pago.model";
import { PdvCaja } from "../../financiero/pdv/caja/caja.model";
import { Cliente } from "../../personas/clientes/cliente.model";
import { Usuario } from "../../personas/usuarios/usuario.model";
import { Cobro } from "./cobro/cobro.model";
import { TipoVenta } from "./enums/tipo-venta.enums";
import { VentaEstado } from "./enums/venta-estado.enums";
import { VentaItem } from "./venta-item.model";

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

    public toInput(): VentaInput {
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
        return input;
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
}

export class VentaPorPeriodo {
    valorGs: number;
    valorRs: number;
    valorDs: number;
    valorTotalGs: number;
    creadoEn: Date;
}