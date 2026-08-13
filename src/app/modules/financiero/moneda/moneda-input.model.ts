import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "./moneda.model";

export class MonedaInput {
    id: number;
    denominacion: string;
    simbolo: string;
    activo: boolean;
    principal: boolean;
    decimales: number;
    reglaRedondeo: string;
    redondeoMultiplo: number;
    paisId: number;
    usuarioId: number = null;
}