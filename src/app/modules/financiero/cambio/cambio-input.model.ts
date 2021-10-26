import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "../moneda/moneda.model";

export class CambioInput {
    id: number;
    valorEnGs: number;
    monedaId: number;
    usuarioId: number;
}