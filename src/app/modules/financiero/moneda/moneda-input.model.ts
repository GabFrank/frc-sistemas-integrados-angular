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
    /** Sin inicializar a propósito: si queda `undefined` la clave no viaja (ver Moneda.toInput). */
    codigoIso?: string;
    paisId: number;
    usuarioId: number = null;
}