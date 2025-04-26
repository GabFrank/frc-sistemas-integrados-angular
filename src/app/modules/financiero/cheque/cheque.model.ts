import { Chequera } from '../chequera/chequera.model';
import { PagoDetalleCuota } from '../../operaciones/pago/pago-detalle-cuota/pago-detalle-cuota.model';
import { Persona } from '../../personas/persona/persona.model';
import { Usuario } from '../../personas/usuarios/usuario.model';

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