import { Usuario } from "../../../personas/usuarios/usuario.model";
import { EstadoJornada } from "../enums/estado-jornada.enum";
import { Marcacion } from "./marcacion.model";

export class Jornada {
    id: number;
    usuario: Usuario;
    fecha: string;

    marcacionEntrada: Marcacion;
    marcacionSalidaAlmuerzo: Marcacion;
    marcacionEntradaAlmuerzo: Marcacion;
    marcacionSalida: Marcacion;

    minutosTrabajados: number;
    minutosExtras: number;
    minutosLlegadaTardia: number;
    minutosLlegadaTardiaAlmuerzo: number;

    turno: string;
    estado: EstadoJornada;
    observacion: string;
    actualizadoEn: string;
}
