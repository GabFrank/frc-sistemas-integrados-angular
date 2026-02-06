import { Sucursal } from "../../../empresarial/sucursal/sucursal.model";
import { Usuario } from "../../../personas/usuarios/usuario.model";
import { TipoMarcacion } from "../enums/tipo-marcacion.enum";

export class Marcacion {
    id: number;
    usuario: Usuario;
    tipo: TipoMarcacion;

    latitud: number;
    longitud: number;
    precisionGps: number;
    distanciaSucursalMetros: number;

    deviceId: string;
    deviceInfo: string;

    sucursalEntrada: Sucursal;
    fechaEntrada: string;

    sucursalSalida: Sucursal;
    fechaSalida: string;

    presencial: boolean;
    autorizacion: number;
    codigo: string;

    toInput(): MarcacionInput {
        let input = new MarcacionInput();
        input.id = this.id;
        input.usuarioId = this.usuario?.id;
        input.tipo = this.tipo;
        input.latitud = this.latitud;
        input.longitud = this.longitud;
        input.precisionGps = this.precisionGps;
        input.distanciaSucursalMetros = this.distanciaSucursalMetros;
        input.deviceId = this.deviceId;
        input.deviceInfo = this.deviceInfo;
        input.sucursalEntradaId = this.sucursalEntrada?.id;
        input.fechaEntrada = this.fechaEntrada;
        input.sucursalSalidaId = this.sucursalSalida?.id;
        input.fechaSalida = this.fechaSalida;
        input.presencial = this.presencial;
        input.codigo = this.codigo;
        return input;
    }
}

export class MarcacionInput {
    id: number;
    usuarioId: number;
    tipo: TipoMarcacion;

    latitud: number;
    longitud: number;
    precisionGps: number;
    distanciaSucursalMetros: number;

    deviceId: string;
    deviceInfo: string;

    sucursalEntradaId: number;
    fechaEntrada: string;

    sucursalSalidaId: number;
    fechaSalida: string;

    presencial: boolean;
    codigo: string;
    embedding: number[];
}
