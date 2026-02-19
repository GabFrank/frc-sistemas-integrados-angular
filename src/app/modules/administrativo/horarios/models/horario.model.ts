import { Usuario } from "../../../personas/usuarios/usuario.model";

export class Horario {
    id: number;
    descripcion: string;
    horaEntrada: string;
    horaSalida: string;
    toleranciaMinutos: number;
    inicioDescanso: string;
    finDescanso: string;
    creadoEn: Date;
    usuario: Usuario;
    dias: string[];
    turno: string;

    toInput(): HorarioInput {
        let input = new HorarioInput();
        input.id = this.id;
        input.descripcion = this.descripcion;
        input.horaEntrada = this.horaEntrada;
        input.horaSalida = this.horaSalida;
        input.toleranciaMinutos = this.toleranciaMinutos;
        input.inicioDescanso = this.inicioDescanso;
        input.finDescanso = this.finDescanso;
        input.usuarioId = this.usuario?.id;
        input.dias = this.dias;
        input.turno = this.turno;
        return input;
    }
}

export class HorarioInput {
    id: number;
    descripcion: string;
    horaEntrada: string;
    horaSalida: string;
    toleranciaMinutos: number;
    inicioDescanso: string;
    finDescanso: string;
    usuarioId: number;
    dias: string[];
    turno: string;
}
