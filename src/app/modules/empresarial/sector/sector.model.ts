import { Zona } from './../zona/zona.model';
import { Usuario } from './../../personas/usuarios/usuario.model';
import { Sucursal } from './../sucursal/sucursal.model';

export class Sector {
    id: number;
    sucursal: Sucursal;
    descripcion: string;
    activo: boolean;
    creadoEn: Date;
    usuario: Usuario;
    zonaList: Zona[]

    toInput(): SectorInput {
        let input = new SectorInput;
        input.id = this.id;
        input.sucursalId = this.sucursal?.id;
        input.descripcion = this.descripcion;
        input.activo = this.activo;
        input.usuarioId = this.usuario?.id;
        return input;
    }
}

export class SectorInput {
    id: number;
    sucursalId: number;
    descripcion: string;
    activo: boolean;
    usuarioId: number;
}