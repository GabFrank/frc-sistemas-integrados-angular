import { Usuario } from '../../../personas/usuarios/usuario.model';
import { Modelo } from './modelo.model';
import { TipoVehiculo } from './tipo-vehiculo.model';

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
    usuario?: Usuario;
    creadoEn?: Date;
}
