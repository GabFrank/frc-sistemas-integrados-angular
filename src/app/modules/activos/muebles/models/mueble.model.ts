
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
    situacionPago?: string;
    proveedor?: Persona;
    moneda?: import('../../../financiero/moneda/moneda.model').Moneda;
    montoTotal?: number;
    montoYaPagado?: number;
    cantidadCuotas?: number;
    diaVencimiento?: number;
    usuario?: Usuario;
    creadoEn?: Date;
}
