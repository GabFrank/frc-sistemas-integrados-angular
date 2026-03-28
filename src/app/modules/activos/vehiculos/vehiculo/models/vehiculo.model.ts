import { Usuario } from '../../../../personas/usuarios/usuario.model';
import { Modelo } from './modelo.model';
import { TipoVehiculo } from './tipo-vehiculo.model';
import { Persona } from '../../../../personas/persona/persona.model';
import { Moneda } from '../../../../financiero/moneda/moneda.model';

export interface Vehiculo {
    id?: number;
    modelo?: Modelo;
    tipoVehiculo?: TipoVehiculo;
    chapa?: string;
    color?: string;
    anho?: number;
    documentacion?: boolean;
    refrigerado?: boolean;
    nuevo?: boolean;
    fechaAdquisicion?: Date;
    primerKilometraje?: number;
    capacidadKg?: number;
    capacidadPasajeros?: number;
    imagenesVehiculo?: string;
    imagenesDocumentos?: string;
    situacionPago?: string;
    proveedor?: Persona;
    moneda?: Moneda;
    montoTotal?: number;
    montoYaPagado?: number;
    cantidadCuotas?: number;
    cantidadCuotasPagadas?: number;
    diaVencimiento?: number;
    usuario?: Usuario;
    creadoEn?: Date;
}
