import { Sector } from '../sector/sector.model';
import { Usuario } from './../../personas/usuarios/usuario.model';

export class Zona {
    id: number;
    sector: Sector;
    descripcion: string;
    activo: boolean;
    usuario: Usuario;
    creadoEn: Date;

    toInput(): ZonaInput {
        let input = new ZonaInput;
        input.id = this.id;
        input.sectorId = this.sector?.id;
        input.descripcion = this.descripcion;
        input.activo = this.activo;
        input.creadoEn = this.creadoEn;
        return input;
    }
}

export class ZonaInput {
    id: number;
    sectorId: number;
    descripcion: string;
    activo: boolean;
    usuarioId: number;
    creadoEn: Date;
}
