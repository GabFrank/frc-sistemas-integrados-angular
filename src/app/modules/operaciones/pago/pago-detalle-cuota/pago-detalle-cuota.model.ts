import { PagoDetalle } from '../pago-detalle/pago-detalle.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Cheque } from '../../../financiero/cheque/cheque.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export enum PagoDetalleCuotaEstado {
    PENDIENTE = 'PENDIENTE',
    PAGO_PARCIAL = 'PAGO_PARCIAL',
    PAGADO = 'PAGADO',
    CANCELADO = 'CANCELADO'
}

export class PagoDetalleCuota {
    id: number;
    pagoDetalle: PagoDetalle;
    referenciaId: number;
    numeroCuota: number;
    fechaVencimiento: Date;
    estado: PagoDetalleCuotaEstado;
    totalPagado: number;
    totalFinal: number;
    creadoEn: Date;
    usuario: Usuario;
    cheque: Cheque;

    toInput(): PagoDetalleCuotaInput {
        let input = new PagoDetalleCuotaInput();
        input.id = this?.id;
        input.pagoDetalleId = this?.pagoDetalle?.id;
        input.referenciaId = this?.referenciaId;
        input.numeroCuota = this?.numeroCuota;
        input.fechaVencimiento = dateToString(this?.fechaVencimiento);
        input.estado = this?.estado;
        input.totalPagado = this?.totalPagado;
        input.totalFinal = this?.totalFinal;
        input.creadoEn = dateToString(this?.creadoEn);
        input.usuarioId = this?.usuario?.id;
        return input;
    }
}

export class PagoDetalleCuotaInput {
    id?: number;
    pagoDetalleId?: number;
    referenciaId?: number;
    numeroCuota?: number;
    fechaVencimiento?: string;
    estado?: PagoDetalleCuotaEstado;
    totalPagado?: number;
    totalFinal?: number;
    creadoEn?: string;
    usuarioId?: number;
} 