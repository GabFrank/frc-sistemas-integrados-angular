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

export interface SolicitudPagoDetalle {
    id?: number;
    moneda?: Moneda;
    formaPago?: FormaPago;
    valor: number;
    fechaPago?: string;
    observacion?: string;
    cotizacion?: number;
    orden?: number;
    fechaEmisionCheque?: string;
    portador?: string;
    nominal?: boolean;
    diferido?: boolean;
    creadoEn?: string;
}

export interface SolicitudPagoDetalleInput {
    id?: number;
    monedaId?: number;
    formaPagoId?: number;
    valor: number;
    fechaPago?: string;
    observacion?: string;
    cotizacion?: number;
    orden?: number;
    fechaEmisionCheque?: string;
    portador?: string;
    nominal?: boolean;
    diferido?: boolean;
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
    detalles?: SolicitudPagoDetalle[];
    tipo?: string;
    referenciaId?: number;

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
        input.detalles = this?.detalles?.map(d => {
            const di: SolicitudPagoDetalleInput = {
                monedaId: d.moneda?.id,
                formaPagoId: d.formaPago?.id,
                valor: d.valor,
                fechaPago: d.fechaPago,
                observacion: d.observacion,
                cotizacion: d.cotizacion,
                orden: d.orden,
                fechaEmisionCheque: d.fechaEmisionCheque,
                portador: d.portador,
                nominal: d.nominal,
                diferido: d.diferido
            };
            if (d.id) di.id = d.id;
            return di;
        }) || [];
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
    detalles?: SolicitudPagoDetalleInput[];
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