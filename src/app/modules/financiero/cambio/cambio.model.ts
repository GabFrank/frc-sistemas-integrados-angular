import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "../moneda/moneda.model";

export class Cambio {
    id: number;
    valorEnGs: number;
    moneda: Moneda;
    creadoEn: Date;
    usuario: Usuario;
}