import { Chequera } from '../chequera/chequera.model';
import { PagoDetalleCuota } from '../../operaciones/pago/pago-detalle-cuota/pago-detalle-cuota.model';
import { Persona } from '../../personas/persona/persona.model';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { Moneda } from '../moneda/moneda.model';
import { CuentaBancaria } from '../cuenta-bancaria/cuenta-bancaria.model';

export enum EstadoCheque {
    EMITIDO = 'EMITIDO',
    DIFERIDO = 'DIFERIDO',
    COBRADO = 'COBRADO',
    ANULADO = 'ANULADO',
}

export class Cheque {
    id: number;
    chequera: Chequera;
    pagoDetalleCuota: PagoDetalleCuota;
    numero: number;
    fechaEntrega: Date;
    fechaPago: Date;
    orden: string;
    concepto: string;
    diferido: boolean;
    total: number;
    beneficiario: string;
    nominal: boolean;
    estado: EstadoCheque;
    moneda: Moneda;
    cuentaBancaria: CuentaBancaria;
    fechaCobro: Date;
    motivoAnulacion: string;
    firmante: Persona;
    creadoEn: Date;
    usuario: Usuario;

    toInput(): ChequeInput {
        let input = new ChequeInput();
        input.id = this?.id;
        input.chequeraId = this?.chequera?.id;
        input.pagoDetalleCuotaId = this?.pagoDetalleCuota?.id;
        input.numero = this?.numero;
        input.fechaEntrega = this?.fechaEntrega;
        input.fechaPago = this?.fechaPago;
        input.orden = this?.orden;
        input.concepto = this?.concepto;
        input.diferido = this?.diferido;
        input.total = this?.total;
        input.firmanteId = this?.firmante?.id;
        input.usuarioId = this?.usuario?.id;
        return input;
    }
}

export class ChequeInput {
    id?: number;
    chequeraId?: number;
    pagoDetalleCuotaId?: number;
    numero?: number;
    fechaEntrega?: Date;
    fechaPago?: Date;
    orden?: string;
    concepto?: string;
    diferido?: boolean;
    total?: number;
    firmanteId?: number;
    usuarioId?: number;
}

// ── Dashboard de cheques ──

/** Total y cantidad de cheques a pagar en un día (por fecha de pago). */
export interface ChequeResumenDia {
    fecha: string;      // yyyy-MM-dd
    total: number;
    cantidad: number;
}

/** Saldo/compromiso de una chequera activa (card del sidebar). */
export interface ChequeSaldoChequera {
    chequera: Chequera;
    cuentaBancaria: CuentaBancaria;
    pendienteHastaFecha: number;
    saldoCuenta: number;
    saldoReservado: number;
    hojasDisponibles: number;
}

/** Filtro del dashboard (fechas ya como String yyyy-MM-dd). */
export interface ChequeDashboardFiltro {
    desde: string;
    hasta: string;
    cuentaBancariaId?: number;
    chequeraId?: number;
    estado?: EstadoCheque | null;
}