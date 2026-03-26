import { Persona } from "../../../personas/persona/persona.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";


export interface Inmueble {
    id?: number;
    propietario?: Persona;
    nombreAsignado?: string;
    paisId?: number;
    ciudadId?: number;
    direccion?: string;
    googleMapsUrl?: string;
    codigoCatastral?: string;
    valorTasacion?: number;
    usuario?: Usuario;
    creadoEn?: Date;
}
