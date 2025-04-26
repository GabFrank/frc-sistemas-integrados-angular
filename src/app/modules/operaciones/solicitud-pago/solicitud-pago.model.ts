import { Usuario } from "../../personas/usuarios/usuario.model";
import { Pago } from "../pago/pago.model";
import { dateToString } from "../../../commons/core/utils/dateUtils";
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
    usuario: Usuario;
    creadoEn: Date;
    estado: SolicitudPagoEstado;
    tipo: TipoSolicitudPago;
    referenciaId: number;
    pago: Pago;

    toInput(): SolicitudPagoInput {
        let input = new SolicitudPagoInput();
        input.id = this?.id;
        input.usuarioId = this?.usuario?.id;
        input.creadoEn = dateToString(this?.creadoEn);
        input.estado = this?.estado;
        input.tipo = this?.tipo;
        input.referenciaId = this?.referenciaId;
        return input;
    }
}

export class SolicitudPagoInput {
    id?: number;
    usuarioId?: number;
    creadoEn?: string;
    estado?: SolicitudPagoEstado;
    tipo?: TipoSolicitudPago;
    referenciaId?: number;
} 