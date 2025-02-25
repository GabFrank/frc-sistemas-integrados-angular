import { Usuario } from "../../personas/usuarios/usuario.model";

export class CategoriaObservacion {
    id: number;
    descripcion: string;
    activo: boolean;
    creadoEn: Date;
    usuario: Usuario;
}