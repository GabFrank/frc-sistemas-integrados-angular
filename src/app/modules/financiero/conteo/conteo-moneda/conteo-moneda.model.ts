import { Usuario } from "../../../personas/usuarios/usuario.model";
import { MonedaBillete } from "../../moneda/moneda-billetes/moneda-billetes.model";
import { Conteo } from "../conteo.model";

export class ConteoMoneda {
    id:number;
    sucursalId: number;
    conteo: Conteo
    monedaBilletes: MonedaBillete
    cantidad: number
    observacion: string
    creadoEn: Date
    usuario: Usuario

    public toInput(): ConteoMonedaInput{
        let input = new ConteoMonedaInput()
        input.id = this.id;
        input.observacion = this.observacion;
        input.usuarioId = this.usuario?.id;
        input.cantidad = this.cantidad;
        input.creadoEn = this.creadoEn;
        input.conteoId = this.conteo?.id;
        input.monedaBilletesId = this.monedaBilletes?.id;
        input.sucursalId = this.sucursalId;
        return input;
    }
}

export class ConteoMonedaInput {
    id:number;
    sucursalId: number;
    conteoId: number
    monedaBilletesId: number
    cantidad: number
    observacion: string
    creadoEn: Date
    usuarioId: number
}