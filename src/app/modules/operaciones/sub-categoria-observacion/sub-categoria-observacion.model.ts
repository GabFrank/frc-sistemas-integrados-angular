import { Usuario } from "../../personas/usuarios/usuario.model";
import { CategoriaObservacion } from "../categoria-observacion/categoria-observacion.model";

export class SubCategoriaObservacion {
    id: number;
    descripcion: string;
    activo: boolean;
    creadoEn: Date;
    categoriaObservacion: CategoriaObservacion;
    usuario: Usuario;
}