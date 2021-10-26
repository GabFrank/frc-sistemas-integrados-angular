import { Usuario } from "../../personas/usuarios/usuario.model";
import { Moneda } from "../moneda/moneda.model";
import { CambioInput } from "./cambio-input.model";

export class Cambio {
    id: number;
    valorEnGs: number;
    moneda: Moneda;
    creadoEn: Date;
    usuario: Usuario;

    toInput(): CambioInput{
        let input = new CambioInput()
        input.valorEnGs = this.valorEnGs;
        input.monedaId = this.moneda?.id;
        input.usuarioId = this.usuario?.id;
        return input;
      }
}