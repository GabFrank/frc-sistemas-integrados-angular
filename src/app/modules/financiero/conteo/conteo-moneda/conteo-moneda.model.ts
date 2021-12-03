import { Usuario } from "../../../personas/usuarios/usuario.model";
import { MonedaBillete } from "../../moneda/moneda-billetes/moneda-billetes.model";
import { Conteo } from "../conteo.model";

export class ConteoMoneda {
    id:number;
    conteo: Conteo
    monedaBilletes: MonedaBillete
    cantidad: number
    observacion: string
    creadoEn: Date
    usuario: Usuario
}

export class ConteoMonedaInput {
    id:number;
    conteoId: number
    monedaBilletesId: number
    cantidad: number
    observacion: string
    creadoEn: Date
    usuarioId: number
}