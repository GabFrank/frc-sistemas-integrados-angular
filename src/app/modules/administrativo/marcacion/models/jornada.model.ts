import { Usuario } from "../../../personas/usuarios/usuario.model";
import { EstadoJornada } from "../enums/estado-jornada.enum";
import { Marcacion } from "./marcacion.model";

export class Jornada {
    id: number;
    sucursalId: number;
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

    // Calculados por el central; solo los trae la consulta del historial.
    minutosLlegadaTardiaTotal?: number;
    distanciaMaximaMetros?: number;
    tieneUbicacion?: boolean;
    puedeAjustarA8Horas?: boolean;
}

export interface JornadaResumen {
    diasTrabajados: number;
    minutosTrabajados: number;
    minutosExtras: number;
    minutosLlegadaTardia: number;
}

/** Una página del historial y el resumen de todo lo que cumple el filtro. */
export interface JornadaHistorial {
    pagina: { getTotalElements: number, getContent: Jornada[] };
    resumen: JornadaResumen;
}

export interface JornadaHistorialFiltro {
    usuarioId?: number;
    fechaInicio: string;
    fechaFin: string;
    turno?: string;
    sucursalEntradaId?: number;
    sucursalSalidaId?: number;
}
