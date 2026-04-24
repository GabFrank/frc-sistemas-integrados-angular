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

    toInput(): any {
        return {
            id: this.id,
            descripcion: this.descripcion,
            usuarioId: this.usuario?.id,
            sucursalId: this.sucursal?.id,
            activo: this.activo
        };
    }
}

export class SectorInput {
    id: number;
    sucursalId: number;
    descripcion: string;
    activo: boolean;
    usuarioId: number = null;
}