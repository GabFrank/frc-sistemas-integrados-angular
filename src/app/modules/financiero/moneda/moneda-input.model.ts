import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "./moneda.model";

export class MonedaInput {
    id: number;
    denominacion: string;
    simbolo: string;
    paisId: number;
    usuarioId: number;
}