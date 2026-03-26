
import { Persona } from '../../../personas/persona/persona.model';
import { Usuario } from '../../../personas/usuarios/usuario.model';
import { FamiliaMueble } from './familia-mueble.model';
import { TipoMueble } from './tipo-mueble.model';

export interface Mueble {
    id?: number;
    propietario?: Persona;
    identificador?: string;
    descripcion?: string;
    familia?: FamiliaMueble;
    tipoMueble?: TipoMueble;
    consumeEnergia?: boolean;
    consumoValor?: string;
    valorTasacion?: number;
    usuario?: Usuario;
    creadoEn?: Date;
}
