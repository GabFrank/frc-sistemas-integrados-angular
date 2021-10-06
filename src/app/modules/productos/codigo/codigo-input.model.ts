import { Usuario } from "../../personas/usuarios/usuario.model";
import { Presentacion } from "../presentacion/presentacion.model";

export class CodigoInput {
    id: number
    codigo: string;
    principal: boolean
    activo: boolean;
    presentacionId: number;
    usuarioId: number
    creadoEn: Date;
}