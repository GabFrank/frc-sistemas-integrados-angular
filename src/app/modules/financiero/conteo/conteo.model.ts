import { Usuario } from "../../personas/usuarios/usuario.model";
import { ConteoMoneda } from "./conteo-moneda/conteo-moneda.model";

export class Conteo {
    id:number;
    observacion: String
    creadoEn: Date
    usuario: Usuario
    conteoMonedaList: ConteoMoneda[]
    totalGs: number;
    totalRs; number;
    totalDs: number;

    public toInput(): ConteoInput{
        let conteoInput = new ConteoInput()
        conteoInput.id = this.id;
        conteoInput.observacion = this.observacion;
        conteoInput.usuarioId = this.usuario?.id;
        conteoInput.creadoEn = this.creadoEn;
        conteoInput.totalGs = this.totalGs;
        conteoInput.totalRs = this.totalRs;
        conteoInput.totalDs = this.totalDs;
        return conteoInput;
    }
}

export class ConteoInput {
    id:number;
    observacion: String
    creadoEn: Date
    usuarioId: number
    totalGs: number;
    totalRs; number;
    totalDs: number;
}