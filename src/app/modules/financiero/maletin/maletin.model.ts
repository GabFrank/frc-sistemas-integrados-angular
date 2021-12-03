import { Usuario } from "../../personas/usuarios/usuario.model";

export class Maletin {
    id: number;
    descripcion: string;
    activo: boolean;
    abierto: boolean;
    creadoEn: Date;
    usuario: Usuario;
}

export class MaletinInput {
    id: number;
    descripcion: string;
    activo: boolean;
    abierto: boolean;
    creadoEn: Date;
    usuarioId: number;
}