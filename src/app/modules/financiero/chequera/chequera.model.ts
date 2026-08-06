import { CuentaBancaria } from '../cuenta-bancaria/cuenta-bancaria.model';
import { Usuario } from '../../personas/usuarios/usuario.model';
import { Cheque } from '../cheque/cheque.model';

export enum EstadoChequera {
    ACTIVA = 'ACTIVA',
    AGOTADA = 'AGOTADA',
    ANULADA = 'ANULADA',
}

export class Chequera {
    id: number;
    cuentaBancaria: CuentaBancaria;
    nombre: string;
    rangoDesde: number;
    rangoHasta: number;
    siguienteNumero: number;
    estado: EstadoChequera;
    hojasDisponibles: number;
    fechaRetiro: Date;
    creadoEn: Date;
    usuario: Usuario;
    cheques: Cheque[];

    toInput(): ChequeraInput {
        let input = new ChequeraInput();
        input.id = this?.id;
        input.cuentaBancariaId = this?.cuentaBancaria?.id;
        input.nombre = this?.nombre;
        input.rangoDesde = this?.rangoDesde;
        input.rangoHasta = this?.rangoHasta;
        input.siguienteNumero = this?.siguienteNumero;
        input.estado = this?.estado;
        input.fechaRetiro = this?.fechaRetiro;
        input.usuarioId = this?.usuario?.id;
        return input;
    }
}

export class ChequeraInput {
    id?: number;
    cuentaBancariaId?: number;
    nombre?: string;
    rangoDesde?: number;
    rangoHasta?: number;
    siguienteNumero?: number;
    estado?: EstadoChequera;
    fechaRetiro?: Date;
    usuarioId?: number;
}