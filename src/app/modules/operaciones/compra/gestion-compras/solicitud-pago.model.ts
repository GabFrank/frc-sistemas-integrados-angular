import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { Pago } from '../../pago/pago.model';
import { Proveedor } from '../../../personas/proveedor/proveedor.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { NotaRecepcion } from './nota-recepcion.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';

export enum SolicitudPagoEstado {
    PENDIENTE = 'PENDIENTE',
    PARCIAL = 'PARCIAL',
    CONCLUIDO = 'CONCLUIDO',
    CANCELADO = 'CANCELADO'
}

export class SolicitudPago {
    id?: number;
    proveedor: Proveedor;
    numeroSolicitud: string;
    fechaSolicitud: Date;
    fechaPagoPropuesta?: Date;
    montoTotal: number;
    moneda: Moneda;
    formaPago?: FormaPago;
    estado: SolicitudPagoEstado;
    observaciones?: string;
    creadoEn: Date;
    usuario?: Usuario;
    pago?: Pago;
    notasRecepcion?: SolicitudPagoNotaRecepcion[];

    // Computed properties for UI
    estadoDisplayNameComputed?: string;
    estadoChipColorComputed?: string;
    fechaSolicitudFormattedComputed?: string;
    fechaPagoPropuestaFormattedComputed?: string;
    montoTotalFormattedComputed?: number;
    cantidadNotasComputed?: number;

    toInput(): SolicitudPagoInput {
        let input = new SolicitudPagoInput();
        input.id = this?.id;
        input.proveedorId = this?.proveedor?.id;
        input.numeroSolicitud = this?.numeroSolicitud;
        input.fechaSolicitud = dateToString(this?.fechaSolicitud);
        input.fechaPagoPropuesta = dateToString(this?.fechaPagoPropuesta);
        input.montoTotal = this?.montoTotal;
        input.monedaId = this?.moneda?.id;
        input.formaPagoId = this?.formaPago?.id;
        input.estado = this?.estado;
        input.observaciones = this?.observaciones;
        input.usuarioId = this?.usuario?.id;
        input.pagoId = this?.pago?.id;
        input.notaRecepcionIds = this?.notasRecepcion?.map(nr => nr?.notaRecepcion?.id).filter(id => id != null) || [];
        return input;
    }
}

export class SolicitudPagoInput {
    id?: number;
    proveedorId?: number;
    numeroSolicitud?: string;
    fechaSolicitud?: string;
    fechaPagoPropuesta?: string;
    montoTotal?: number;
    monedaId?: number;
    formaPagoId?: number;
    estado?: SolicitudPagoEstado;
    observaciones?: string;
    usuarioId?: number;
    pagoId?: number;
    notaRecepcionIds?: number[];
}

export class SolicitudPagoNotaRecepcion {
    id?: number;
    solicitudPago: SolicitudPago;
    notaRecepcion: NotaRecepcion;
    montoIncluido: number;
    creadoEn: Date;

    toInput(): SolicitudPagoNotaRecepcionInput {
        let input = new SolicitudPagoNotaRecepcionInput();
        input.id = this?.id;
        input.solicitudPagoId = this?.solicitudPago?.id;
        input.notaRecepcionId = this?.notaRecepcion?.id;
        input.montoIncluido = this?.montoIncluido;
        return input;
    }
}

export class SolicitudPagoNotaRecepcionInput {
    id?: number;
    solicitudPagoId?: number;
    notaRecepcionId?: number;
    montoIncluido?: number;
}