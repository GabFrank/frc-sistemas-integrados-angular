import { Persona } from "../../../personas/persona/persona.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { Pais } from "../../../general/pais/pais.model";
import { Ciudad } from "../../../general/ciudad/ciudad.model";

export interface Inmueble {
    id?: number;
    propietario?: Persona;
    nombreAsignado?: string;
    pais?: Pais;
    paisId?: number;
    ciudad?: Ciudad;
    ciudadId?: number;
    direccion?: string;
    googleMapsUrl?: string;
    codigoCatastral?: string;
    valorTasacion?: number;
    situacionPago?: string;
    proveedor?: Persona;
    moneda?: any;
    montoTotal?: number;
    montoYaPagado?: number;
    cantidadCuotas?: number;
    cantidadCuotasPagadas?: number;
    diaVencimiento?: number;
    usuario?: Usuario;
    creadoEn?: Date;
}
