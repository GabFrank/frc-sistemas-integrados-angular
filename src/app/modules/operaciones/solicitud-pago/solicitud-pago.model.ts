import { Usuario } from "../../personas/usuarios/usuario.model";
import { Pago } from "../pago/pago.model";
import { dateToString } from "../../../commons/core/utils/dateUtils";
import { Proveedor } from "../../personas/proveedor/proveedor.model";
import { FormaPago } from "../../financiero/forma-pago/forma-pago.model";
import { Moneda } from "../../financiero/moneda/moneda.model";

// Placeholder temporal hasta que se cree el modelo real en la Fase 1.2
interface RecepcionMercaderia {
    id: number;
    // ... otros campos según sea necesario
}

export enum SolicitudPagoEstado {
    PENDIENTE = 'PENDIENTE',
    PARCIAL = 'PARCIAL',
    CONCLUIDO = 'CONCLUIDO',
    CANCELADO = 'CANCELADO'
}

export enum TipoSolicitudPago {
    COMPRA = 'COMPRA',
    GASTO = 'GASTO',
    RRHH = 'RRHH'
}

export class SolicitudPago {
    id: number;
    proveedor: Proveedor;
    montoTotal: number;
    moneda: Moneda;
    formaPago: FormaPago;
    estado: SolicitudPagoEstado;
    creadoEn: Date;
    usuario: Usuario;
    pago: Pago;
    recepcionMercaderiaList: any[]; // Mantener para la UI, pero no se mapea al Input principal

    toInput(): SolicitudPagoInput {
        let input = new SolicitudPagoInput();
        input.id = this?.id;
        input.proveedorId = this?.proveedor?.id;
        input.montoTotal = this.montoTotal;
        input.monedaId = this?.moneda?.id;
        input.formaPagoId = this?.formaPago?.id;
        input.estado = this?.estado;
        input.creadoEn = dateToString(this?.creadoEn);
        input.usuarioId = this?.usuario?.id;
        input.pagoId = this?.pago?.id;
        return input;
    }
}

export class SolicitudPagoInput {
    id?: number;
    proveedorId: number;
    montoTotal: number;
    monedaId: number;
    formaPagoId: number;
    estado: SolicitudPagoEstado;
    creadoEn: string;
    usuarioId: number;
    pagoId: number;
}

// NUEVA CLASE INPUT para la mutación específica
export class SolicitudPagoMultipleRecepcionesInput {
    proveedorId: number;
    descripcion: string;
    recepcionMercaderiaIds: number[];
    usuarioId: number;
} 