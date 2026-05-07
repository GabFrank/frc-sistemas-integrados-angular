import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "../moneda/moneda.model";

export class CambioInput {
    id: number;
    valorEnGs: number;
    valorEnGsCambio?: number;
    valorEnGsVentaMercado?: number;
    valorEnGsCompraMercado?: number;
    monedaId: number;
    usuarioId: number = null;
}