import { Sucursal } from '../../../empresarial/sucursal/sucursal.model';
import { FormaPago } from '../../../financiero/forma-pago/forma-pago.model';
import { Moneda } from '../../../financiero/moneda/moneda.model';
import { PdvCaja } from '../../../financiero/pdv/caja/caja.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Pago } from '../pago.model';
import { dateToString } from '../../../../commons/core/utils/dateUtils';
export class PagoDetalle {
    id: number;
    pago: Pago;
    usuario: Usuario;
    creadoEn: Date;
    moneda: Moneda;
    formaPago: FormaPago;
    total: number;
    sucursal: Sucursal;
    caja: PdvCaja;
    activo: boolean;
    fechaProgramado: Date;
    plazo: boolean;
    cuotas: number;

    toInput(): PagoDetalleInput {
        let input = new PagoDetalleInput();
        input.id = this?.id;
        input.pagoId = this?.pago?.id;
        input.usuarioId = this?.usuario?.id;
        input.creadoEn = dateToString(this?.creadoEn);
        input.monedaId = this?.moneda?.id;
        input.formaPagoId = this?.formaPago?.id;
        input.total = this?.total;
        input.sucursalId = this?.sucursal?.id;
        input.cajaId = this?.caja?.id;
        input.activo = this?.activo;
        input.fechaProgramado = dateToString(this?.fechaProgramado);
        input.plazo = this?.plazo;
        input.cuotas = this?.cuotas;
        return input;
    }
}

export class PagoDetalleInput {
    id?: number;
    pagoId?: number;
    usuarioId?: number;
    creadoEn?: string;
    monedaId?: number;
    formaPagoId?: number;
    total?: number;
    sucursalId?: number;
    cajaId?: number;
    activo?: boolean;
    fechaProgramado?: string;
    plazo?: boolean;
    cuotas?: number;
} 