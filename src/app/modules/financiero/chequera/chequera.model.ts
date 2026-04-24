import { CuentaBancaria } from '../cuenta-bancaria/cuenta-bancaria.model';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { Cheque } from '../cheque/cheque.model';

export class Chequera {
    id: number;
    cuentaBancaria: CuentaBancaria;
    rangoDesde: number;
    rangoHasta: number;
    fechaRetiro: Date;
    creadoEn: Date;
    usuario: Usuario;
    cheques: Cheque[];

    toInput(): ChequeraInput {
        let input = new ChequeraInput();
        input.id = this?.id;
        input.cuentaBancariaId = this?.cuentaBancaria?.id;
        input.rangoDesde = this?.rangoDesde;
        input.rangoHasta = this?.rangoHasta;
        input.fechaRetiro = this?.fechaRetiro;
        input.usuarioId = this?.usuario?.id;
        return input;
    }
}

export class ChequeraInput {
    id?: number;
    cuentaBancariaId?: number;
    rangoDesde?: number;
    rangoHasta?: number;
    fechaRetiro?: Date;
    usuarioId?: number;
} 